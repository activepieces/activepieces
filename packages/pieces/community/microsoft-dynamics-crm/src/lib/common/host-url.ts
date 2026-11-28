const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const API_SUFFIX_PATTERN = /\/api\/data(\/v\d+(\.\d+)?)?$/i;
const API_VERSION_PATH = '/api/data/v9.2';

function parseUrl({ raw, label, allowHttp }: ParseUrlParams): URL {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text === '') {
    throw new Error(
      `The ${label} is empty. Use the full address of your environment, for example https://yourorg.crm.dynamics.com.`
    );
  }
  const withScheme = SCHEME_PATTERN.test(text) ? text : `https://${text}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(
      `The ${label} "${text.slice(0, 100)}" is not a valid URL. Use an address like https://yourorg.crm.dynamics.com.`
    );
  }
  const allowed = allowHttp
    ? url.protocol === 'https:' || url.protocol === 'http:'
    : url.protocol === 'https:';
  if (!allowed) {
    throw new Error(
      `The ${label} must start with https://, for example https://yourorg.crm.dynamics.com.`
    );
  }
  if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    throw new Error(
      `The ${label} must not contain a user name, password, query or fragment.`
    );
  }
  return url;
}

function trimPath(pathname: string): string {
  return pathname.replace(/\/+$/, '');
}

function normalizeHostUrl(raw: unknown): string {
  const url = parseUrl({ raw, label: 'Environment URL', allowHttp: false });
  const path = trimPath(trimPath(url.pathname).replace(API_SUFFIX_PATTERN, ''));
  return `${url.origin}${path}`;
}

function normalizeProxyUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return undefined;
  }
  const url = parseUrl({ raw, label: 'Proxy URL', allowHttp: true });
  return `${url.origin}${trimPath(url.pathname)}`;
}

function getBaseUrl({ hostUrl, proxyUrl }: HostParams): string {
  return normalizeProxyUrl(proxyUrl) ?? normalizeHostUrl(hostUrl);
}

function getApiBaseUrl({ hostUrl, proxyUrl }: HostParams): string {
  return `${getBaseUrl({ hostUrl, proxyUrl })}${API_VERSION_PATH}`;
}

function getEnvironmentApiUrl(hostUrl: unknown): string {
  return `${normalizeHostUrl(hostUrl)}${API_VERSION_PATH}`;
}

type ParseUrlParams = {
  raw: unknown;
  label: string;
  allowHttp: boolean;
};

type HostParams = {
  hostUrl: unknown;
  proxyUrl?: unknown;
};

export const dynamicsHostUrl = {
  normalizeHostUrl,
  normalizeProxyUrl,
  getBaseUrl,
  getApiBaseUrl,
  getEnvironmentApiUrl,
  API_VERSION_PATH,
};
