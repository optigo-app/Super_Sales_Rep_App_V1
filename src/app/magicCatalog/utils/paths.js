/**
 * Path utilities for the magicCatalog running under the /V1 basePath.
 *
 * next/image and next/link automatically prepend the basePath,
 * but regular <img src="...">, fetch() calls, and SVG <image href>
 * do NOT — use these helpers for those cases.
 */
const BASE_PATH = '/V1';
const MC_BASE = '/V1/magicCatalog';

/** Prefix a static asset path with the basePath, e.g. "/images/x.png" → "/V1/images/x.png" */
export const assetPath = (p) => {
  if (!p || typeof p !== 'string') return p;
  if (p.startsWith('http') || p.startsWith('data:') || p.startsWith(BASE_PATH)) return p;
  return `${BASE_PATH}${p.startsWith('/') ? '' : '/'}${p}`;
};

/** Prefix an API route path with the magicCatalog base, e.g. "/api/logger" → "/V1/magicCatalog/api/logger" */
export const apiPath = (p) => {
  if (!p || typeof p !== 'string') return p;
  if (p.startsWith('http') || p.startsWith('data:') || p.startsWith(MC_BASE)) return p;
  return `${MC_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
};
