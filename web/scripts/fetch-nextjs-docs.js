// This script fetches the Next.js documentation from the Next.js GitHub repository
// and saves it to the data/next-docs-mdx directory
import fs from 'fs/promises';
import path from 'path';

const githubRepoUrl = 'https://github.com/vercel/next.js';
const branch = 'canary';
const docsDir = 'docs';


