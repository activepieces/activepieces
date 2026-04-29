import { NormalizedOperation, NormalizedParam, GeneratorContext, MappedProperty, DynamicDropdownConfig } from '../types';

export function generateAction({
  op,
  ctx,
}: {
  op: NormalizedOperation;
  ctx: GeneratorContext;
}): string {
  const camel = toCamelCase(ctx.pieceName);
  const authVarName = `${camel}Auth`;
  const clientVarName = `${camel}ApiClient`;
  const hasAuth = ctx.spec.auth.kind !== 'none';

  const exportName = `${operationIdToCamel(op.operationId)}Action`;

  const allProps = [...op.pathParams, ...op.queryParams];
  const bodyProps = op.hasComplexBody ? [] : op.bodyParams;
  // Body params win over query params with the same name (POST/PUT body is the primary input).
  const bodyParamNames = new Set(bodyProps.map(p => p.name));
  const deduplicatedAllProps = allProps.filter(p => !bodyParamNames.has(p.name));
  const dynamicDropdowns = ctx.dynamicDropdowns ?? {};

  const propsBlock = buildPropsBlock({
    params: [...deduplicatedAllProps, ...bodyProps],
    hasComplexBody: op.hasComplexBody,
    dynamicDropdowns,
    authVarName,
    hasAuth,
  });
  const runBlock = buildRunBlock({ op, clientVarName, hasComplexBody: op.hasComplexBody, hasAuth });

  const authImports = hasAuth ? `import { ${authVarName} } from '../auth';\n` : '';

  return `import { createAction, Property } from '@activepieces/pieces-framework';
${authImports}import { ${clientVarName} } from '../common';

export const ${exportName} = createAction({${hasAuth ? `\n  auth: ${authVarName},` : ''}
  name: '${op.actionName}',
  displayName: '${escapeString(op.displayName)}',
  description: '${escapeString(op.description)}',
  props: {
${propsBlock}  },
  async run({ ${hasAuth ? 'auth, ' : ''}propsValue }) {
${runBlock}  },
});
`;
}

function buildPropsBlock({
  params,
  hasComplexBody,
  dynamicDropdowns,
  authVarName,
  hasAuth,
}: {
  params: NormalizedParam[];
  hasComplexBody: boolean;
  dynamicDropdowns: Record<string, DynamicDropdownConfig>;
  authVarName: string;
  hasAuth: boolean;
}): string {
  const lines = params.map(p => {
    const dropdownConfig = dynamicDropdowns[p.name] ?? dynamicDropdowns[p.safeName];
    if (dropdownConfig) {
      return `    ${p.safeName}: ${buildDropdownCall({ param: p, config: dropdownConfig, authVarName, hasAuth })},`;
    }
    return `    ${p.safeName}: ${buildPropertyCall(p.mappedProperty)},`;
  });

  if (hasComplexBody) {
    lines.push(`    body: Property.Json({
      displayName: 'Request Body',
      description: 'JSON body for this request.',
      required: false,
    }),`);
  }

  return lines.join('\n') + (lines.length > 0 ? '\n' : '');
}

function buildDropdownCall({
  param,
  config,
  authVarName,
  hasAuth,
}: {
  param: NormalizedParam;
  config: DynamicDropdownConfig;
  authVarName: string;
  hasAuth: boolean;
}): string {
  const refreshers = config.refreshers && config.refreshers.length > 0
    ? config.refreshers.map(r => `'${r}'`).join(', ')
    : '';

  const itemsExpr = config.itemsPath
    ? buildItemsPathExpr(config.itemsPath)
    : `Array.isArray(body) ? body as Record<string, unknown>[] : ((body['data'] ?? body['items'] ?? []) as Record<string, unknown>[])`;

  const authProp = hasAuth ? `\n      auth: ${authVarName},` : '';
  const authArg = hasAuth ? 'auth, ' : '';

  return `Property.Dropdown({
      displayName: '${escapeString(param.mappedProperty.displayName)}',
      description: '${escapeString(param.mappedProperty.description)}',
      required: ${param.required},${authProp}
      refreshers: [${refreshers}],
      options: async ({ auth }) => {
        const response = await ${authVarName.replace('Auth', 'ApiClient')}.get({ ${authArg}endpoint: '${config.endpoint}' });
        const body = response.body as Record<string, unknown>;
        const items = ${itemsExpr};
        return {
          options: items.map(item => ({
            label: String(item['${config.labelField}']),
            value: item['${config.valueField}'],
          })),
        };
      },
    })`;
}

function buildItemsPathExpr(itemsPath: string): string {
  const parts = itemsPath.split('.');
  const chain = parts.reduce((acc, part) => `(${acc} as Record<string, unknown>)['${part}']`, 'body');
  return `(${chain} ?? []) as Record<string, unknown>[]`;
}

function buildPropertyCall(prop: MappedProperty): string {
  const defaultLine = prop.defaultValue !== undefined
    ? `\n      defaultValue: ${JSON.stringify(prop.defaultValue)},`
    : '';
  const descLine = prop.description ? `\n      description: '${escapeString(prop.description)}',` : '';

  switch (prop.propertyKind) {
    case 'SHORT_TEXT':
      return `Property.ShortText({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'LONG_TEXT':
      return `Property.LongText({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'NUMBER':
      return `Property.Number({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'CHECKBOX':
      return `Property.Checkbox({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'DATE_TIME':
      return `Property.DateTime({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'FILE':
      return `Property.File({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},
    })`;

    case 'ARRAY':
      return `Property.Array({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'OBJECT':
      return `Property.Object({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'JSON':
      return `Property.Json({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
    })`;

    case 'STATIC_DROPDOWN': {
      const opts = (prop.enumOptions ?? []).map(o => `{ label: '${escapeString(String(o.label))}', value: ${JSON.stringify(o.value)} }`).join(', ');
      return `Property.StaticDropdown({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
      options: {
        options: [${opts}],
      },
    })`;
    }

    case 'STATIC_MULTI_SELECT': {
      const opts = (prop.enumOptions ?? []).map(o => `{ label: '${escapeString(String(o.label))}', value: ${JSON.stringify(o.value)} }`).join(', ');
      return `Property.StaticMultiSelectDropdown({
      displayName: '${escapeString(prop.displayName)}',${descLine}
      required: ${prop.required},${defaultLine}
      options: {
        options: [${opts}],
      },
    })`;
    }
  }
}

function buildRunBlock({
  op,
  clientVarName,
  hasComplexBody,
  hasAuth,
}: {
  op: NormalizedOperation;
  clientVarName: string;
  hasComplexBody: boolean;
  hasAuth: boolean;
}): string {
  const resolvedPath = op.pathParams.length > 0
    ? buildInterpolatedPath(op.path, op.pathParams)
    : `'${op.path}'`;

  const authArg = hasAuth ? 'auth, ' : '';

  const method = op.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

  if (method === 'get') {
    if (op.pagination) {
      return buildPaginatedRun({ op, clientVarName, resolvedPath, authArg });
    }

    const queryEntries = op.queryParams.map(p => `        ${p.name}: propsValue.${p.safeName},`).join('\n');
    const queryArg = op.queryParams.length > 0
      ? `,\n      queryParams: {\n${queryEntries}\n      }`
      : '';

    return `    const response = await ${clientVarName}.get({
      ${authArg}endpoint: ${resolvedPath}${queryArg},
    });
    return response.body;
`;
  }

  if (method === 'delete') {
    return `    const response = await ${clientVarName}.delete({
      ${authArg}endpoint: ${resolvedPath},
    });
    return response.body;
`;
  }

  const bodyContent = hasComplexBody
    ? '...(propsValue.body as Record<string, unknown>)'
    : op.bodyParams.map(p => `        ${p.name}: propsValue.${p.safeName},`).join('\n');

  const bodyBlock = hasComplexBody
    ? `body: { ${bodyContent} }`
    : `body: {\n${bodyContent}\n      }`;

  return `    const response = await ${clientVarName}.${method}({
      ${authArg}endpoint: ${resolvedPath},
      ${bodyBlock},
    });
    return response.body;
`;
}

function buildInterpolatedPath(path: string, pathParams: NormalizedParam[]): string {
  let result = path;
  for (const p of pathParams) {
    result = result.replace(`{${p.name}}`, `\${propsValue.${p.safeName}}`);
  }
  return '`' + result + '`';
}

function buildPaginatedRun({
  op,
  clientVarName,
  resolvedPath,
  authArg,
}: {
  op: NormalizedOperation;
  clientVarName: string;
  resolvedPath: string;
  authArg: string;
}): string {
  const pagination = op.pagination!;
  const strategy = pagination.strategy;
  const cursorVar = strategy === 'page' ? 'page' : 'cursor';
  const cursorInit = strategy === 'page' ? '1' : 'undefined';
  const nextCursorExpr = strategy === 'page'
    ? "typeof response.body === 'object' && response.body !== null ? (response.body as Record<string, unknown>)['has_more'] === true ? currentPage + 1 : undefined : undefined"
    : "typeof response.body === 'object' && response.body !== null ? (response.body as Record<string, unknown>)['next_cursor'] as string | undefined : undefined";

  return `    const allItems: unknown[] = [];
    let ${cursorVar}: ${strategy === 'page' ? 'number' : 'string | undefined'} = ${cursorInit};
    do {
      const response = await ${clientVarName}.get({
        ${authArg}endpoint: ${resolvedPath},
        queryParams: {
          ${pagination.limitParam}: propsValue.${op.queryParams.find(p => p.name === pagination.limitParam)?.safeName ?? 'limit'} ?? 100,
          ${pagination.cursorParam}: ${cursorVar},
        },
      });
      const body = response.body as Record<string, unknown>;
      const items = Array.isArray(body['data']) ? body['data'] : (Array.isArray(body['items']) ? body['items'] : [body]);
      allItems.push(...(items as unknown[]));
      ${strategy === 'page' ? `const currentPage = ${cursorVar};
      ` : ''}${cursorVar} = ${nextCursorExpr};
    } while (${cursorVar});
    return allItems;
`;
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

function operationIdToCamel(id: string): string {
  const camel = id.replace(/[-_](.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, c => c.toLowerCase());
  return /^[0-9]/.test(camel) ? `p${camel}` : camel;
}

function toPascalCase(kebab: string): string {
  const result = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return /^[0-9]/.test(result) ? `P${result}` : result;
}

function toCamelCase(kebab: string): string {
  const p = toPascalCase(kebab);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
