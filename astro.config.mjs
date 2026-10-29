import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://shinespark.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
