// This script fetches the Next.js documentation from the Next.js GitHub repository and saves it to the data/nextjs-docs-markdown directory
import fs from 'fs/promises';
import path from 'path';

const owner = 'vercel';
const repo = 'next.js';
const branch = 'canary';
const docsDir = 'docs';
const outputDir = "./data/nextjs-docs-markdown";

// Helper function to check if a file is an MDX or MD file
function isMdxOrMd(fileName) {
    return fileName.toLowerCase().endsWith('.mdx') || fileName.toLowerCase().endsWith('.md');
}


// Use Github content API to fetch the documentation
const url = `https://api.github.com/repos/${owner}/${repo}/contents/${docsDir}?ref=${branch}`;

// Helper function to get the headers for the API request
function getHeaders() {
  return {
  'User-Agent': 'rag-powered-nextjs-docs-script',
  'Accept': 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};
}

async function downloadDocumentation(url, folder = '') {
    const headers = getHeaders();
    const response = await fetch(url, { headers });
    if (!response.ok) {
        console.error(`Failed to list directory: ${url} (${response.status} ${response.statusText})`);
        return;
    }
    const data = await response.json();

    // Iterate through the data and download the documentation
    for (const item of data) {
        if (item.type === 'dir') {
            await downloadDocumentation(item.url, path.join(folder, item.name));
        }
        // If the item is a file and is an MDX or MD file, download the content
        else if (item.type === 'file' && isMdxOrMd(item.name)) {
            const fileResponse = await fetch(item.download_url, { headers });
            if (!fileResponse.ok) {
                console.error(`Failed to download file: ${item.path} (${fileResponse.status} ${fileResponse.statusText})`);
                continue;
            }
            const fileText = await fileResponse.text();

            await fs.mkdir(path.join(outputDir, folder), { recursive: true });
            await fs.writeFile(path.join(outputDir, folder, item.name), fileText);

            console.log(`Downloaded: ${path.join(outputDir, folder, item.name)}`);
        }
        else {
            console.log(`Skipped: ${item.name}`);
        }
    }
}

downloadDocumentation(url);



    




