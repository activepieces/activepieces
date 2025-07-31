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

const constructConfig = (
  clientType: 'claude' | 'cursor' | 'url',
  url: string,
) => {
  const serverName = 'Activepieces';

  if (clientType === 'claude') {
    return {
      mcpServers: {
        [serverName]: {
          command: 'npx',
          args: ['-y', 'mcp-remote', url],
        },
      },
    };
  }

  return {
    mcpServers: {
      [serverName]: {
        url,
      },
    },
  };
};

export const mcpConnectUtils = {
  maskToken,
  replaceIpWithLocalhost,
  constructConfig,
};
