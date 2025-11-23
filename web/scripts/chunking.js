// This script chunks the Next.js documentation and saves it to the data/nextjs-docs-chunks directory

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '..', 'data', 'nextjs-docs-markdown');
const chunksDir = path.join(__dirname, '..', 'data', 'nextjs-docs-chunks');
const chunksFile = path.join(chunksDir, "chunks.json");
const chunksArray = [];

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
            const filePath = path.join(directoryPath, item.name);
            const docContent = await fs.readFile(filePath, 'utf8');

            // Obtain the title and description from the frontmatter of the file
            const { data } = matter(docContent);
            const title = data.title;
            const description = data.description;
            console.log(title, description);

            const chunks = await splitter.splitText(docContent);
            for(let i = 0; i < chunks.length; i++){
                chunksArray.push({
                    id: `${item.name}#${i}`,
                    metadata: {
                        title: title,
                        description: description,
                    },
                    content: chunks[i],
                });
            }
        }
        else{
            console.log(`Skipped ${item.name}`);
        }
    }
}

await chunkDocs(docsDir);

// Create the chunks directory if it doesn't exist
await fs.mkdir(chunksDir, { recursive: true });

// Write the chunks to the file
await fs.writeFile(chunksFile, JSON.stringify(chunksArray, null, 2), 'utf8');

console.log(`Wrote ${chunksArray.length} chunks to ${chunksFile}`);