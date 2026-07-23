const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';
const GOV_LOGIN_HOST = 'login.microsoftonline.us';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  [GOV_LOGIN_HOST]: 'https://graph.microsoft.us',
};

// ponytail: single global-commercial default; add a cloud auth field if GCC High is needed.
export function getGraphBaseUrl(cloudLoginHost?: string | null): string {
  const host = cloudLoginHost ?? COMMERCIAL_LOGIN_HOST;
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}
