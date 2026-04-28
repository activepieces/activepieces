import { ExtractedAuth, GeneratorContext } from '../types';

export function generateAuth({ ctx }: { ctx: GeneratorContext }): string {
  const { auth } = ctx.spec;
  const pascal = toPascalCase(ctx.pieceName);
  const camel = toCamelCase(ctx.pieceName);
  const authVarName = `${camel}Auth`;
  const authTypeName = `${pascal}Auth`;

  return `import { PieceAuth } from '@activepieces/pieces-framework';

export const ${authVarName} = ${buildAuthCall({ auth, pascal })};

export type ${authTypeName} = typeof ${authVarName};
`;
}

function buildAuthCall({ auth, pascal }: { auth: ExtractedAuth; pascal: string }): string {
  switch (auth.kind) {
    case 'apiKey':
      return `PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your ${pascal} API key.',
  required: true,
})`;

    case 'bearer':
      return `PieceAuth.SecretText({
  displayName: 'Bearer Token',
  description: 'Your ${pascal} bearer token.',
  required: true,
})`;

    case 'basic':
      return `PieceAuth.BasicAuth({
  displayName: 'Credentials',
  required: true,
  username: { displayName: 'Username' },
  password: { displayName: 'Password' },
})`;

    case 'oauth2':
      return `PieceAuth.OAuth2({
  displayName: 'OAuth2 Connection',
  required: true,
  authUrl: '${auth.authUrl}',
  tokenUrl: '${auth.tokenUrl}',
  scope: [${auth.scopes.map(s => `'${s}'`).join(', ')}],
})`;

    case 'none':
      return 'PieceAuth.None()';
  }
}

function toPascalCase(kebab: string): string {
  const result = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return /^[0-9]/.test(result) ? `P${result}` : result;
}

function toCamelCase(kebab: string): string {
  const pascal = toPascalCase(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
