import { isNil, tryCatchSync } from '@activepieces/core-utils';

function save(from: string | null | undefined) {
  if (!isMcpAuthorizePath(from)) {
    tryCatchSync(() => sessionStorage.removeItem(STORAGE_KEY));
    return;
  }
  tryCatchSync(() => sessionStorage.setItem(STORAGE_KEY, from));
}

function consume(): string | null {
  const { data } = tryCatchSync(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return stored;
  });
  return isMcpAuthorizePath(data) ? data : null;
}

function isMcpAuthorizePath(path: string | null | undefined): path is string {
  if (isNil(path)) {
    return false;
  }
  return (
    path === MCP_AUTHORIZE_PATH || path.startsWith(`${MCP_AUTHORIZE_PATH}?`)
  );
}

const STORAGE_KEY = 'federatedLoginRedirect';
const MCP_AUTHORIZE_PATH = '/mcp-authorize';

export const federatedLoginRedirect = { save, consume };
