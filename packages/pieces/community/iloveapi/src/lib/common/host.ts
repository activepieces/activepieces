const ALLOWED_HOST = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.(ilovepdf|iloveimg|iloveapi)\.com$/;

function assertServerHost(server: unknown): string {
  const host = typeof server === 'string' ? server.trim().toLowerCase() : '';
  if (!ALLOWED_HOST.test(host)) {
    throw new Error(
      `iLoveAPI returned an unexpected server "${String(server).slice(0, 100)}". The request was stopped so your credentials are not sent to another host.`
    );
  }
  return host;
}

function isAllowedUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.port === '' &&
    ALLOWED_HOST.test(parsed.hostname)
  );
}

export const iloveHost = { assertServerHost, isAllowedUrl };
