import path from 'node:path';
import { readValidatedPosts } from './posts.mjs';

const cwd = process.cwd();
const postsDir = path.join(cwd, 'content/posts');
const posts = readValidatedPosts(postsDir);
console.log(`Validated ${posts.length} posts`);
