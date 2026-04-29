import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';
import { OpenAPISpec } from './types';

export const specLoader = { load };

async function load({ filePath }: { filePath: string }): Promise<OpenAPISpec> {
  const raw = await readFile(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();
  const parsed = ext === '.json'
    ? JSON.parse(raw) as Record<string, unknown>
    : yaml.load(raw) as Record<string, unknown>;

  // Strip vendor extension keys at every level before dereferencing so that
  // swagger-parser does not follow $refs inside x-* fields (e.g. x-spotify-policy).
  const cleaned = stripExtensions(parsed);

  const api = await SwaggerParser.dereference(cleaned as Parameters<typeof SwaggerParser.dereference>[0], {
    dereference: { circular: 'ignore' },
  });
  return api as unknown as OpenAPISpec;
}

function stripExtensions(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripExtensions);
  if (node !== null && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (!key.startsWith('x-')) out[key] = stripExtensions(value);
    }
    return out;
  }
  return node;
}
