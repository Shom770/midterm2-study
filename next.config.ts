import type { NextConfig } from 'next';

// Static export: `npm run build` writes a plain site to out/.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
};

export default config;
