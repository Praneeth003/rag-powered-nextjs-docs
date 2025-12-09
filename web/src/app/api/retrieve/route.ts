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


    try {
        // Embed the query
        const queryEmbeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: query,
        });

        const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

        // Retrieve the relevant chunks from the Supabase database
        const { data, error } = await supabase.rpc('retrieve_relevant_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.55,
            match_count: 10,
        });

        if (error) {
            console.error('Failed to retrieve relevant chunks:', error);
            return NextResponse.json({ error: 'Failed to retrieve relevant chunks' }, { status: 500 });
        }

        console.log('Retrieved relevant chunks:', data);
        return NextResponse.json(data);
    } catch (err) {
        console.error('Failed to create embedding:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
