import { existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
export const exists = (p: string) => existsSync(join(dist, p));
