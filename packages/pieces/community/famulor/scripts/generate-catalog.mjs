import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const specPath = process.argv[2];
if (!specPath) throw new Error('Usage: node scripts/generate-catalog.mjs <openapi.json> [--check]');
const source = readFileSync(specPath, 'utf8');
const spec = JSON.parse(source);

function dereference(value) {
  if (!value?.$ref) return value;
  if (!value.$ref.startsWith('#/')) throw new Error('Only local schema references are supported');
  return dereference(value.$ref.slice(2).split('/').reduce((node, key) => node[key.replace(/~1/g, '/').replace(/~0/g, '~')], spec));
}

function field(schemaInput) {
  const schema = dereference(schemaInput) ?? {};
  const types = Array.isArray(schema.type) ? schema.type.filter((type) => type !== 'null') : [schema.type];
  const type = schema.oneOf || schema.anyOf || schema.allOf ? 'json' : types[0] ?? (schema.properties ? 'object' : 'json');
  return Object.fromEntries(Object.entries({
    type, description: schema.description, format: schema.format, enum: schema.enum,
    minimum: schema.minimum, maximum: schema.maximum, minLength: schema.minLength,
    maxLength: schema.maxLength, readOnly: schema.readOnly, writeOnly: schema.writeOnly,
    default: schema.default, items: schema.items ? field(schema.items) : undefined,
  }).filter(([, value]) => value !== undefined));
}

function bodyFields(input) {
  const schema = dereference(input) ?? {};
  if (schema.oneOf || schema.anyOf || schema.allOf || !schema.properties) return undefined;
  return Object.entries(schema.properties).filter(([, value]) => !dereference(value).readOnly).map(([name, value]) => ({
    name, required: (schema.required ?? []).includes(name), ...field(value),
  }));
}

const operations = Object.entries(spec.paths).flatMap(([path, pathItem]) =>
  ['get', 'post', 'put', 'patch', 'delete'].filter((method) => pathItem[method]).map((method) => {
    const operation = pathItem[method];
    if (!operation.operationId) throw new Error(`Missing operationId: ${method} ${path}`);
    const requestBody = dereference(operation.requestBody);
    const jsonSchema = requestBody?.content?.['application/json']?.schema;
    const responseFormats = Object.entries(operation.responses ?? {}).filter(([status]) => /^2/.test(status)).flatMap(([, response]) => Object.keys(dereference(response).content ?? {}));
    return {
      id: operation.operationId, method: method.toUpperCase(), path,
      summary: operation.summary ?? operation.operationId,
      description: operation.description ?? operation.summary ?? operation.operationId,
      tag: operation.tags?.[0] ?? 'Workspace',
      parameters: [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map(dereference).map((parameter) => ({
        name: parameter.name, in: parameter.in, required: parameter.required === true,
        ...field(parameter.schema), description: parameter.description ?? parameter.schema?.description,
        style: parameter.style, explode: parameter.explode,
      })),
      ...(requestBody ? { body: {
        required: requestBody.required === true, description: dereference(jsonSchema)?.description,
        fields: bodyFields(jsonSchema),
      } } : {}),
      ...(responseFormats.some((format) => format.startsWith('audio/')) ? { binary: true } : {}),
    };
  }),
).sort((a, b) => a.id.localeCompare(b.id));
if (new Set(operations.map((operation) => operation.id)).size !== operations.length) throw new Error('Duplicate operationId');
const output = `import type { ApiOperation } from '../common/types';\n\nexport const catalogSource = ${JSON.stringify({ url: 'https://docs.famulor.io/api-reference/openapi.json', sha256: createHash('sha256').update(source).digest('hex'), count: operations.length })};\n\nexport const operations: ApiOperation[] = [\n${operations.map((operation) => `  ${JSON.stringify(operation)},`).join('\n')}\n];\n`;
const target = fileURLToPath(new URL('../src/lib/generated/catalog.ts', import.meta.url));
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Generated catalog is stale');
} else writeFileSync(target, output);
console.log(`${operations.length} public API operations ${process.argv.includes('--check') ? 'verified' : 'generated'}`);
