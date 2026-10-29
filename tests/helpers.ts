import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
export const read = (p: string) => readFileSync(join(dist, p), 'utf8');
export const exists = (p: string) => existsSync(join(dist, p));
