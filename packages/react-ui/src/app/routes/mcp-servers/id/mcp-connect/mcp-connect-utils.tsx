export type McpClientType = 'claude' | 'cursor' | 'windsurf' | 'url';

const maskToken = (url: string) => {
  return url.replace(/\/([^/]+)\/sse$/, '/•••••••••••••••••••••/sse');
};

const replaceIpWithLocalhost = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname)) {
      parsed.hostname = 'localhost';
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const constructConfig = (clientType: McpClientType, url: string) => {
  const serverName = 'Activepieces';

  switch (clientType) {
    case 'claude':
      return {
        mcpServers: {
          [serverName]: {
            command: 'npx',
            args: ['-y', 'mcp-remote', url],
          },
        },
      };
    case 'cursor':
    case 'windsurf':
    case 'url':
      return {
        mcpServers: {
          [serverName]: {
            url,
          },
        },
      };
  }
};

export const mcpConnectUtils = {
  maskToken,
  replaceIpWithLocalhost,
  constructConfig,
};
