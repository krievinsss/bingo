import { cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
for (const filename of ['index.html', 'favicon.svg']) cpSync(filename, `dist/${filename}`);
cpSync('src', 'dist/src', { recursive: true });
console.log('Built static application to dist/ (no external dependencies).');
