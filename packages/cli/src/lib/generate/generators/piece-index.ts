import { GeneratorContext } from '../types';

export function generatePieceIndex({ ctx }: { ctx: GeneratorContext }): string {
  const camel = toCamelCase(ctx.pieceName);
  const hasAuth = ctx.spec.auth.kind !== 'none';
  const authVarName = `${camel}Auth`;

  const actionImports = ctx.spec.operations
    .map(op => {
      const exportName = `${operationIdToCamel(op.operationId)}Action`;
      return `import { ${exportName} } from './lib/actions/${op.fileName}';`;
    })
    .join('\n');

  const actionList = ctx.spec.operations
    .map(op => {
      const exportName = `${operationIdToCamel(op.operationId)}Action`;
      return `    ${exportName},`;
    })
    .join('\n');

  return `import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
${hasAuth ? `import { ${authVarName} } from './lib/auth';\n` : ''}${actionImports}

export const ${camel} = createPiece({
  displayName: '${ctx.displayName}',
  description: '${escapeString(ctx.spec.description)}',
  auth: ${hasAuth ? authVarName : 'PieceAuth.None()'},
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/${ctx.pieceName}.png',
  authors: [],
  actions: [
${actionList}
  ],
  triggers: [],
});
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
