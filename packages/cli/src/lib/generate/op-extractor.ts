import { NormalizedOperation, NormalizedParam, OpenAPISpec, OpenAPIOperation, OpenAPISchema, PaginationHint } from './types';
import { schemaMapper } from './schema-mapper';

export const opExtractor = { extract };

const ALLOWED_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);
const RESERVED_WORDS = new Set(['from', 'default', 'class', 'import', 'export', 'return', 'new', 'delete', 'type', 'in', 'of', 'for', 'if', 'else', 'function', 'const', 'let', 'var', 'this']);

function extract({ spec, tags }: { spec: OpenAPISpec; tags?: string[] }): NormalizedOperation[] {
  const operations: NormalizedOperation[] = [];
  const usedNames = new Set<string>();
  const tagFilter = tags && tags.length > 0 ? new Set(tags.map(t => t.toLowerCase())) : null;

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, opRaw] of Object.entries(pathItem)) {
      if (!ALLOWED_METHODS.has(method)) continue;
      const op = opRaw as OpenAPIOperation;

      if (tagFilter) {
        const opTags = (op.tags ?? []).map(t => t.toLowerCase());
        if (!opTags.some(t => tagFilter.has(t))) continue;
      }

      const operation = normalizeOperation({ op, path, method: method as NormalizedOperation['method'], usedNames });
      if (operation) operations.push(operation);
    }
  }

  return operations;
}

function normalizeOperation({
  op,
  path,
  method,
  usedNames,
}: {
  op: OpenAPIOperation;
  path: string;
  method: NormalizedOperation['method'];
  usedNames: Set<string>;
}): NormalizedOperation | null {
  const rawId = op.operationId ?? deriveOperationId({ method, path });
  const operationId = dedupeId({ id: rawId, used: usedNames });
  usedNames.add(operationId);

  const actionName = toSnakeCase(operationId);
  const fileName = toKebabCase(operationId);

  const pathParams = extractParams({ params: op.parameters ?? [], location: 'path' });
  const queryParams = extractParams({ params: op.parameters ?? [], location: 'query' });

  const { bodyParams, hasComplexBody, mediaType } = extractBody({ op });

  const pagination = detectPagination({ queryParams });

  return {
    operationId,
    actionName,
    fileName,
    method: method.toUpperCase() as NormalizedOperation['method'],
    path,
    displayName: op.summary ?? humanizeId(operationId),
    description: op.description ?? op.summary ?? '',
    pathParams,
    queryParams,
    bodyParams,
    hasComplexBody,
    mediaType,
    deprecated: op.deprecated ?? false,
    pagination,
  };
}

function extractParams({
  params,
  location,
}: {
  params: Array<{ name: string; in: string; description?: string; required?: boolean; schema?: OpenAPISchema; deprecated?: boolean }>;
  location: 'path' | 'query' | 'header';
}): NormalizedParam[] {
  return params
    .filter(p => p.in === location && !p.deprecated)
    .map(p => {
      const safeName = makeSafeName(p.name);
      return {
        name: p.name,
        safeName,
        displayName: humanize(p.name),
        description: p.description ?? '',
        required: location === 'path' ? true : (p.required ?? false),
        mappedProperty: schemaMapper.mapParam({
          name: p.name,
          schema: p.schema,
          required: location === 'path' ? true : (p.required ?? false),
          description: p.description ?? '',
        }),
      };
    });
}

function extractBody({ op }: { op: OpenAPIOperation }): {
  bodyParams: NormalizedParam[];
  hasComplexBody: boolean;
  mediaType: 'json' | 'form-data' | null;
} {
  if (!op.requestBody?.content) return { bodyParams: [], hasComplexBody: false, mediaType: null };

  const content = op.requestBody.content;

  if (content['application/json']?.schema) {
    const schema = content['application/json'].schema as OpenAPISchema;
    const { params, complex } = flattenSchemaToParams({ schema });
    return { bodyParams: params, hasComplexBody: complex, mediaType: 'json' };
  }

  if (content['multipart/form-data']?.schema || content['application/x-www-form-urlencoded']?.schema) {
    const schema = (content['multipart/form-data']?.schema ?? content['application/x-www-form-urlencoded']?.schema) as OpenAPISchema;
    const { params, complex } = flattenSchemaToParams({ schema });
    return { bodyParams: params, hasComplexBody: complex, mediaType: 'form-data' };
  }

  return { bodyParams: [], hasComplexBody: true, mediaType: 'json' };
}

function flattenSchemaToParams({ schema }: { schema: OpenAPISchema }): { params: NormalizedParam[]; complex: boolean } {
  if (schema.type !== 'object' || !schema.properties) {
    return { params: [], complex: true };
  }

  const requiredFields = new Set(schema.required ?? []);
  const props = schema.properties;

  if (Object.keys(props).length > 15) {
    return { params: [], complex: true };
  }

  const params: NormalizedParam[] = Object.entries(props).map(([name, fieldSchema]) => {
    const isRequired = requiredFields.has(name);
    const safeName = makeSafeName(name);
    return {
      name,
      safeName,
      displayName: humanize(name),
      description: fieldSchema.description ?? '',
      required: isRequired,
      mappedProperty: schemaMapper.mapSchema({
        schema: fieldSchema,
        required: isRequired,
        displayName: humanize(name),
        description: fieldSchema.description ?? '',
      }),
    };
  });

  return { params, complex: false };
}

function detectPagination({ queryParams }: { queryParams: NormalizedParam[] }): PaginationHint | null {
  const names = queryParams.map(p => p.name.toLowerCase());
  const hasLimit = names.some(n => ['limit', 'per_page', 'page_size', 'count'].includes(n));
  const cursorParam = queryParams.find(p => ['cursor', 'next_cursor', 'after', 'page_token'].includes(p.name.toLowerCase()));
  const offsetParam = queryParams.find(p => ['offset', 'skip', 'page'].includes(p.name.toLowerCase()));

  if (!hasLimit) return null;

  const limitParam = queryParams.find(p => ['limit', 'per_page', 'page_size', 'count'].includes(p.name.toLowerCase()))?.name ?? 'limit';

  if (cursorParam) {
    return { strategy: 'cursor', limitParam, cursorParam: cursorParam.name };
  }
  if (offsetParam) {
    const strategy = offsetParam.name.toLowerCase() === 'page' ? 'page' : 'offset';
    return { strategy, limitParam, cursorParam: offsetParam.name };
  }

  return null;
}

function deriveOperationId({ method, path }: { method: string; path: string }): string {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map(s => s.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]/g, '_'))
    .filter(Boolean);
  return `${method}_${segments.join('_')}`;
}

function dedupeId({ id, used }: { id: string; used: Set<string> }): string {
  if (!used.has(id)) return id;
  let i = 2;
  while (used.has(`${id}_${i}`)) i++;
  return `${id}_${i}`;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
}

function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, '-');
}

function humanize(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function humanizeId(id: string): string {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function makeSafeName(name: string): string {
  let safe = name
    .replace(/[-.\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9_]/g, '_');

  if (/^[0-9]/.test(safe)) safe = '_' + safe;

  if (RESERVED_WORDS.has(safe)) safe = safe + 'Value';

  return safe;
}
