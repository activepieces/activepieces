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

export const mcpConnectUtils = {
  maskToken,
  replaceIpWithLocalhost,
};
