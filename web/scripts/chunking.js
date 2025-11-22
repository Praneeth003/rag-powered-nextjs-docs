// This script chunks the Next.js documentation and saves it to the data/nextjs-docs-chunks directory
import fs from 'fs/promises';
import path from 'path';
import { MarkdownTextSplitter } from '@langchain/textsplitters';

const docsDir = "./data/nextjs-docs-markdown";
const chunksDir = "./data/nextjs-docs-chunks";
const chunksFile = path.join(chunksDir, "chunks.json");

// Configure chunks
const defaultChunkSize = 1200;
const defaultChunkOverlap = 200;

// Initialize the splitter
const splitter = new MarkdownHeaderTextSplitter({
    chunkSize: defaultChunkSize,
    chunkOverlap: defaultChunkOverlap,
});

