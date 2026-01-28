// This route is used to retrieve the embeddings from the Supabase database
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// Types for the retrieved chunks
interface RetrievedChunk {
    id: string;
    content: string;
    title: string | null;
    description: string | null;
    similarity: number;
}


// Querying API Route Handler
export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const query = (() => {
        if (typeof body === 'object' && body !== null && 'query' in body) {
            const q = (body as { query: unknown }).query;
            return typeof q === 'string' ? q.trim() : '';
        }
        return '';
    })();

    if (query.length === 0) {
        return NextResponse.json({ error: 'Query must be a non-empty string' }, { status: 400 });
    }

    // Expand short or vague queries to improve retrieval
    const expandQuery = async (originalQuery: string): Promise<string> => {
        // If query is short or doesn't contain context keywords, expand it
        const isShortQuery = originalQuery.split(' ').length <= 5;
        const hasContext = /\b(next\.?js|nextjs|react|web|framework|documentation)\b/i.test(originalQuery);

        if (isShortQuery && !hasContext) {
            try {
                // Use LLM to expand the query with relevant context
                const expansion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a query expansion assistant. Expand technical queries to be more specific and include relevant context. Keep it concise.',
                        },
                        {
                            role: 'user',
                            content: `Expand this query to be more specific for searching Next.js documentation: "${originalQuery}"\n\nReturn only the expanded query, nothing else.`,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 50,
                });

                const expanded = expansion.choices[0]?.message?.content?.trim();
                if (expanded && expanded.length > 0) {
                    console.log(`Query expanded: "${originalQuery}" -> "${expanded}"`);
                    return expanded;
                }
            } catch (err) {
                console.error('Query expansion failed, using original:', err);
            }
        }

        return originalQuery;
    };

    try {
        // Expand query if needed
        const expandedQuery = await expandQuery(query);
        const queryToUse = expandedQuery !== query ? expandedQuery : query;
        const wasExpanded = expandedQuery !== query;

        // Embed the query (use expanded version if available)
        const queryEmbeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: queryToUse,
        });

        const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

        // Try with lower threshold first for better recall, then filter results
        const matchThreshold = 0.3; // Lower threshold for better recall
        const matchCount = 15; // Get more candidates

        // Retrieve the relevant chunks from the Supabase database
        const { data, error } = await supabase.rpc('retrieve_relevant_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
        });

        if (error) {
            console.error('Failed to retrieve relevant chunks:', error);
            return NextResponse.json({ error: 'Failed to retrieve relevant chunks' }, { status: 500 });
        }

        console.log('Retrieved relevant chunks:', data);
        console.log('Number of chunks retrieved:', data.length);

        if (data.length === 0) {
            return NextResponse.json({ error: 'No relevant chunks found' }, { status: 200 });
        }

        // Type the retrieved chunks
        const chunks = data as RetrievedChunk[];

        // Sort by relevance and apply adaptive filtering
        const sortedChunks = chunks.sort((a, b) => b.similarity - a.similarity);

        // Adaptive threshold: use top chunks even if similarity is lower
        // If we have chunks with similarity >= 0.4, use those
        // Otherwise, use top chunks even if similarity is lower (but >= 0.25)
        const highQualityChunks = sortedChunks.filter(chunk => chunk.similarity >= 0.4);
        const relevantChunks = highQualityChunks.length > 0
            ? highQualityChunks.slice(0, 8)
            : sortedChunks.filter(chunk => chunk.similarity >= 0.25).slice(0, 8);

        if (relevantChunks.length === 0) {
            console.log(`No chunks found. Query: "${query}", Expanded: "${queryToUse}", Threshold used: ${matchThreshold}`);
            return NextResponse.json({
                error: 'No relevant chunks found. Try rephrasing your question or being more specific.',
                suggestion: 'Try adding more context, e.g., "What is SSR and SSG in Next.js?" instead of "What is SSR and SSG?"'
            }, { status: 200 });
        }

        console.log(`Found ${relevantChunks.length} relevant chunks (similarity range: ${relevantChunks[relevantChunks.length - 1]?.similarity.toFixed(3)} - ${relevantChunks[0]?.similarity.toFixed(3)})`);

        // Create the context text from retrieved chunks with better formatting
        const contextText = relevantChunks
            .map((chunk, index) => {
                let context = `--- Chunk ${index + 1} (Relevance: ${(chunk.similarity * 100).toFixed(1)}%) ---`;
                if (chunk.title) {
                    context += `\n📄 Title: ${chunk.title}`;
                }
                if (chunk.description) {
                    context += `\n📝 Description: ${chunk.description}`;
                }
                context += `\n\n${chunk.content}`;
                return context;
            })
            .join('\n\n');

        // Generate response using OpenAI with improved prompts
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert technical documentation assistant. Your role is to provide accurate, comprehensive, and well-structured answers based on the provided documentation context.

Guidelines:
- Answer ONLY using information from the provided context chunks
- If the context doesn't contain enough information, clearly state what information is missing
- Structure your answer with clear sections, bullet points, or numbered lists when appropriate
- Include code examples from the context when relevant
- Be concise but thorough - prioritize accuracy over verbosity
- If multiple chunks contain relevant information, synthesize them into a coherent answer
- Use markdown formatting for better readability (headers, code blocks, lists)`,
                },
                {
                    role: 'user',
                    content: `Based on the following documentation context, please answer the question below.

${contextText}

---

Question: ${query}${wasExpanded ? ` (expanded from: "${query}")` : ''}

Please provide a comprehensive, well-structured answer based on the context above. If the context doesn't fully answer the question, indicate what additional information would be helpful.`,
                },
            ],
            temperature: 0.3, // Lower temperature for more focused, consistent responses
            max_tokens: 1500, // Increased for more comprehensive answers
            top_p: 0.9, // Nucleus sampling for better quality
        });

        const answer = completion.choices[0]?.message?.content;

        if (!answer) {
            return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
        }

        return NextResponse.json({
            answer,
            chunks: relevantChunks.map(chunk => ({
                id: chunk.id,
                title: chunk.title,
                description: chunk.description,
                similarity: chunk.similarity,
            })),
        });
    } catch (err) {
        console.error('Error in retrieve endpoint:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
