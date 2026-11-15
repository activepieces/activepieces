const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';
const GOV_LOGIN_HOST = 'login.microsoftonline.us';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  [GOV_LOGIN_HOST]: 'https://graph.microsoft.us',
};

const BOT_SERVICE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://smba.trafficmanager.net/teams/',
  [GOV_LOGIN_HOST]: 'https://smba.infra.gov.teams.microsoft.us/teams/',
};

// ponytail: single global-commercial default; add a cloud auth field if GCC High is needed.
function getGraphBaseUrl(cloudLoginHost?: string | null): string {
  const host = cloudLoginHost ?? COMMERCIAL_LOGIN_HOST;
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}

function getBotServiceUrl(cloudLoginHost?: string | null): string {
  const host = cloudLoginHost ?? COMMERCIAL_LOGIN_HOST;
  return BOT_SERVICE_URLS[host] ?? BOT_SERVICE_URLS[COMMERCIAL_LOGIN_HOST];
}

export const microsoftCloud = { getGraphBaseUrl, getBotServiceUrl };
