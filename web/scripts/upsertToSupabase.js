// This script upserts the embeddings to the Supabase database
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if(!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY){
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

const pairedEmbeddingsFile = path.join(__dirname, '..', 'data', 'nextjs-docs-paired-embeddings', 'paired-embeddings.json');

const pairedEmbeddings = JSON.parse(await fs.readFile(pairedEmbeddingsFile, 'utf8'));

// Upsert the embeddings to the Supabase database
for(const embedding of pairedEmbeddings){
    const { error } = await supabase.from('nextjs_docs_chunks').upsert({
        id: embedding.id,
        content: embedding.content,
        title: embedding?.metadata?.title ?? null,
        description: embedding?.metadata?.description ?? null,
        embedding: embedding.embedding,
    }, { onConflict: 'id' });
    if (error) {
        console.error(`Error upserting ${embedding.id}: ${error.message}`);
        process.exit(1);
    } else {
        console.log(`Upserted ${embedding.id}`);
    }
}

console.log('Done');



