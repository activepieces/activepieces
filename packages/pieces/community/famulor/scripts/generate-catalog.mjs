import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
    if (typeof operation.operationId !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(operation.operationId)) throw new Error(`Invalid operationId: ${method} ${path}. Use a camelCase identifier containing only letters and numbers.`);
    if (new Set(['await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements', 'interface', 'package', 'private', 'protected', 'public']).has(operation.operationId)) throw new Error('Operation IDs must not be reserved JavaScript identifiers.');
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
const aliases = { getMe: 'getCurrentUser', createCall: 'makePhoneCall' };
const actionNames = operations.map(({ id }) => aliases[id] ?? id);
const filenames = operations.map(({ id }) => id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase());
if (new Set(actionNames).size !== actionNames.length || new Set(filenames).size !== filenames.length) throw new Error('Operation IDs produce duplicate native action names or filenames.');
const output = `import type { ApiOperation } from '../common/types';\n\nexport const catalogSource = ${JSON.stringify({ url: 'https://docs.famulor.io/api-reference/openapi.json', sha256: createHash('sha256').update(source).digest('hex'), count: operations.length })};\n\nexport const operations: ApiOperation[] = [\n${operations.map((operation) => `  ${JSON.stringify(operation)},`).join('\n')}\n];\n`;
const target = fileURLToPath(new URL('../src/lib/generated/catalog.ts', import.meta.url));
function saveGenerated({ target, content }) {
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== content) throw new Error(`Generated file is stale: ${target}`);
  } else writeFileSync(target, content);
}
saveGenerated({ target, content: output });
const actionsFolder = fileURLToPath(new URL('../src/lib/actions/native/', import.meta.url));
mkdirSync(actionsFolder, { recursive: true });
const actions = operations.map((operation) => {
  const name = aliases[operation.id] ?? operation.id;
  const filename = operation.id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const definition = `import { createNativeAction } from '../../common/action';\n\nexport const ${name} = createNativeAction({ id: '${operation.id}'${name === operation.id ? '' : `, name: '${name}'`} });\n`;
  saveGenerated({ target: `${actionsFolder}${filename}.ts`, content: definition });
  return { name, filename };
});
const registry = `${actions.map(({ name, filename }) => `import { ${name} } from '../actions/native/${filename}';`).join('\n')}\n\nexport const nativeActions = [\n${actions.map(({ name }) => `  ${name},`).join('\n')}\n];\n`;
saveGenerated({ target: fileURLToPath(new URL('../src/lib/generated/native-actions.ts', import.meta.url)), content: registry });
console.log(`${operations.length} public API operations ${process.argv.includes('--check') ? 'verified' : 'generated'}`);
