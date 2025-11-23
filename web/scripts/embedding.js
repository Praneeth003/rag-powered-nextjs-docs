// This script indexes(embeds) the chunks

import fs from 'fs/promises';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chunksDir = path.join(__dirname, '..', 'data', 'nextjs-docs-chunks');
const chunksFile = path.join(chunksDir, "chunks.json");
const chunksArray = JSON.parse(await fs.readFile(chunksFile, 'utf8'));

const allEmbeddings = [];

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

if(!openai){
    throw new Error('OPENAI_API_KEY is not set');
}

// Embed the chunks in batches
const batchSize = 100;

for(let i = 0; i < chunksArray.length; i += batchSize){
    const batch = chunksArray.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: batch.map(chunk => chunk.content)
    });
    // Add the embeddings to the allEmbeddings array
    allEmbeddings.push(...response.data);

    if(!response){
        throw new Error('Failed to embed chunks, seems like the OpenAI API is not working');
    }
}

// Pair embeddings with corresponding chunks
const pairedEmbeddings = chunksArray.map((chunk, index) => ({
    ...chunk,
    embedding: allEmbeddings[index].embedding
}));    


// Save the paired embeddings to the data directory
const pairedEmbeddingsFile = path.join(__dirname, '..', 'data', 'nextjs-docs-paired-embeddings', 'paired-embeddings.json');
await fs.mkdir(path.dirname(pairedEmbeddingsFile), { recursive: true });
await fs.writeFile(pairedEmbeddingsFile, JSON.stringify(pairedEmbeddings, null, 2), 'utf8');



