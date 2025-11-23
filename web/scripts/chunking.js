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
const splitter = new MarkdownTextSplitter({
    chunkSize: defaultChunkSize,
    chunkOverlap: defaultChunkOverlap,
});

// Helper function to check if a file is an MDX or MD file
function isMdxOrMd(fileName) {
    return fileName.toLowerCase().endsWith('.mdx') || fileName.toLowerCase().endsWith('.md');
}

// Chunk the documentation
async function chunkDocs(directoryPath) {
    const items = await fs.readdir(directoryPath, {withFileTypes: true});

    for(const item of items){
        if(item.isDirectory()){
            await chunkDocs(path.join(directoryPath, item.name));
        }
        else if(item.isFile() && isMdxOrMd(item.name)){
            const docContent = await fs.readFile(path.join(directoryPath, item.name), 'utf8');
            const chunks = await splitter.splitText(docContent);
            console.log(`Chunked ${item.name} into ${chunks.length} chunks`);
            for(const chunk of chunks){
                console.log(chunk);
            }
        }
        else{
            console.log(`Skipped ${item.name}`);
        }
    }
}

chunkDocs(docsDir);