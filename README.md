# RAG-Powered Next.js Documentation Search

A Retrieval-Augmented Generation (RAG) system built with Next.js that enables semantic search and Q&A over Next.js documentation using OpenAI embeddings and Supabase vector search.

## Overview

This project implements a RAG (Retrieval-Augmented Generation) system that:

1. Downloads Next.js documentation from GitHub
2. Chunks the documentation into smaller, manageable pieces
3. Generates embeddings using OpenAI's `text-embedding-3-large` model
4. Stores embeddings in Supabase with vector similarity search capabilities
5. Provides an API endpoint for semantic search and Q&A using GPT-4o-mini

## Architecture

### Components

1. **Documentation Pipeline** (`web/scripts/`)
   - `downloadDocs.js`: Downloads Next.js documentation from GitHub
   - `chunking.js`: Splits markdown files into chunks using LangChain's MarkdownTextSplitter
   - `embedding.js`: Generates embeddings for each chunk using OpenAI
   - `upsertToSupabase.js`: Uploads chunks and embeddings to Supabase

2. **API Endpoint** (`web/src/app/api/retrieve/route.ts`)
   - Accepts natural language queries
   - Expands short/vague queries automatically
   - Retrieves relevant documentation chunks using vector similarity
   - Generates comprehensive answers using GPT-4o-mini with retrieved context

### Key Features

- **Query Expansion**: Automatically expands short queries (e.g., "what is ssr?" → "What is SSR in Next.js?")
- **Adaptive Retrieval**: Uses lower similarity thresholds for better recall, then filters by relevance
- **Context-Aware Answers**: Provides answers based on retrieved documentation chunks
- **Source Attribution**: Returns source chunks with similarity scores

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Supabase account ([Sign up here](https://supabase.com))

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rag-powered-nextjs-docs
```

### 2. Install Dependencies

```bash
cd web
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the following SQL to create the table and function:

```sql
-- Create the table for storing documentation chunks
CREATE TABLE IF NOT EXISTS nextjs_docs_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  title TEXT,
  description TEXT,
  embedding vector(3072) -- 3072 dimensions for text-embedding-3-large
);

-- Create an index for vector similarity search
CREATE INDEX IF NOT EXISTS nextjs_docs_chunks_embedding_idx
ON nextjs_docs_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to retrieve relevant chunks
CREATE OR REPLACE FUNCTION retrieve_relevant_chunks(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id text,
  content text,
  title text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nextjs_docs_chunks.id,
    nextjs_docs_chunks.content,
    nextjs_docs_chunks.title,
    nextjs_docs_chunks.description,
    1 - (nextjs_docs_chunks.embedding <=> query_embedding) AS similarity
  FROM nextjs_docs_chunks
  WHERE 1 - (nextjs_docs_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY nextjs_docs_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 4. Configure Environment Variables

Create a `.env.local` file in the `web` directory:

```bash
cd web
touch .env.local
```

Add the following environment variables:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find your Supabase credentials in:

- Project Settings → API → Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- Project Settings → API → anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 5. Build the Documentation Index

Run the following scripts in order to download, chunk, embed, and upload the documentation:

```bash
# 1. Download Next.js documentation from GitHub
npm run fetch-nextjs-docs

# 2. Chunk the documentation into smaller pieces
npm run chunk-nextjs-docs

# 3. Generate embeddings for each chunk
npm run embed-nextjs-docs

# 4. Upload chunks and embeddings to Supabase
npm run upsert-embeddings
```

**Note**: The embedding step may take a while and will consume OpenAI API credits. The process processes chunks in batches of 100.

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on [http://localhost:3000](http://localhost:3000)

## Usage

### API Endpoint

The RAG system exposes a single API endpoint:

**POST** `/api/retrieve`

#### Request Body

```json
{
  "query": "What is Server-Side Rendering in Next.js?"
}
```

#### Response

```json
{
  "answer": "Server-Side Rendering (SSR) in Next.js allows you to...",
  "chunks": [
    {
      "id": "filename.mdx#0",
      "title": "Server-Side Rendering",
      "description": "Learn about SSR in Next.js",
      "similarity": 0.85
    }
  ]
}
```

### Testing the API

#### Using cURL

```bash
curl -X POST http://localhost:3000/api/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "What is SSR and SSG in Next.js?"}'
```

#### Using JavaScript/TypeScript

```javascript
const response = await fetch("http://localhost:3000/api/retrieve", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "How do I use Server Components?",
  }),
});

const data = await response.json();
console.log(data.answer);
console.log(data.chunks);
```

#### Using Python

```python
import requests

response = requests.post(
    'http://localhost:3000/api/retrieve',
    json={'query': 'What is static site generation?'}
)

data = response.json()
print(data['answer'])
print(data['chunks'])
```

### Query Examples

The API handles various query formats:

- **Short queries**: `"what is ssr?"` (automatically expanded)
- **Specific queries**: `"How do I use Server Components in Next.js?"`
- **Technical questions**: `"What is the difference between SSR and SSG?"`
- **How-to questions**: `"How to implement API routes?"`

## Implementation Details

### Query Processing

1. **Query Expansion**: Short queries (≤5 words) without context keywords are automatically expanded using GPT-4o-mini to include relevant context (e.g., "Next.js").

2. **Embedding Generation**: The query (original or expanded) is converted to an embedding using OpenAI's `text-embedding-3-large` model.

3. **Vector Search**: The embedding is used to search Supabase for similar chunks using cosine similarity with a threshold of 0.3.

4. **Adaptive Filtering**:
   - If chunks with similarity ≥ 0.4 exist, those are used
   - Otherwise, top chunks with similarity ≥ 0.25 are selected
   - Maximum of 8 chunks are used for context

5. **Answer Generation**: GPT-4o-mini generates a comprehensive answer using:
   - System prompt with guidelines for structured, accurate responses
   - Context from retrieved chunks
   - User's original question
   - Temperature: 0.3 (for consistency)
   - Max tokens: 1500

### Chunking Strategy

- **Chunk Size**: 1200 characters
- **Chunk Overlap**: 200 characters
- **Splitter**: LangChain's MarkdownTextSplitter (preserves markdown structure)

### Embedding Model

- **Model**: `text-embedding-3-large`
- **Dimensions**: 3072
- **Batch Size**: 100 chunks per API call

## Scripts Reference

| Script                      | Description                       |
| --------------------------- | --------------------------------- |
| `npm run dev`               | Start development server          |
| `npm run build`             | Build for production              |
| `npm run start`             | Start production server           |
| `npm run fetch-nextjs-docs` | Download Next.js docs from GitHub |
| `npm run chunk-nextjs-docs` | Split docs into chunks            |
| `npm run embed-nextjs-docs` | Generate embeddings for chunks    |
| `npm run upsert-embeddings` | Upload chunks to Supabase         |

## Project Structure

```
rag-powered-nextjs-docs/
├── web/
│   ├── src/
│   │   └── app/
│   │       └── api/
│   │           └── retrieve/
│   │               └── route.ts      # RAG API endpoint
│   ├── scripts/
│   │   ├── downloadDocs.js           # Download documentation
│   │   ├── chunking.js                # Chunk markdown files
│   │   ├── embedding.js               # Generate embeddings
│   │   └── upsertToSupabase.js       # Upload to Supabase
│   ├── data/
│   │   ├── nextjs-docs-markdown/     # Downloaded docs
│   │   ├── nextjs-docs-chunks/       # Chunked docs
│   │   └── nextjs-docs-paired-embeddings/ # Chunks + embeddings
│   └── package.json
└── README.md
```

## Troubleshooting

### No chunks found

- **Issue**: Query returns "No relevant chunks found"
- **Solution**:
  - Try rephrasing with more context (e.g., add "in Next.js")
  - Check if embeddings were uploaded successfully
  - Verify Supabase function `retrieve_relevant_chunks` exists

### Embedding errors

- **Issue**: "Failed to embed chunks"
- **Solution**:
  - Verify `OPENAI_API_KEY` is set correctly
  - Check OpenAI API quota/credits
  - Ensure internet connection is available

### Supabase connection errors

- **Issue**: "Failed to retrieve relevant chunks"
- **Solution**:
  - Verify Supabase credentials in `.env.local`
  - Check if table and function exist in Supabase
  - Ensure vector extension is enabled in Supabase

### Query expansion not working

- **Issue**: Short queries still don't find results
- **Solution**:
  - Check OpenAI API key is valid
  - Review console logs for expansion errors
  - Manually add context to your query

## Environment Variables

| Variable                        | Description                            | Required |
| ------------------------------- | -------------------------------------- | -------- |
| `OPENAI_API_KEY`                | OpenAI API key for embeddings and chat | Yes      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                   | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key          | Yes      |
