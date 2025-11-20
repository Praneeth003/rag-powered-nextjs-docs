// This script indexes the Next.js documentation and saves embeddings.json file it to the data/nextjs-docs-index directory

import fs from 'fs/promises';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const embeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "Hello, world!",
});

console.log(embeddings);


