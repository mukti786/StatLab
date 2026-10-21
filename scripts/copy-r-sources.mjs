import { cp, mkdir } from 'node:fs/promises';

await mkdir(new URL('../public/r/', import.meta.url), { recursive: true });
await cp(new URL('../r/', import.meta.url), new URL('../public/r/', import.meta.url), { recursive: true });
console.log('Copied the project R source library to public/r for browser loading.');
