export function tokenHosts(apiDomain: string): TokenHosts {
  const apiHost = hostOf(apiDomain);
  const dataCentre = /^(?:www\.)?zohoapis\.(.+)$/.exec(apiHost)?.[1];
  const zohoDomains = dataCentre === undefined ? [] : dataCentre === 'ca' ? ['zohocloud.ca'] : [`zoho.${dataCentre}`];
  return {
    apiHost,
    downloadHosts: zohoDomains.flatMap((domain) => [`download-accl.${domain}`, `download.${domain}`]),
  };
}

export function zohoTokenUrl({ raw, hosts }: { raw: string; hosts: TokenHosts }): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') return null;
  if (url.port !== '' && url.port !== '443') return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const path = decodedPath(url.pathname);
  if (path === null || FUNCTIONS_PATH.test(path)) return null;
  if (host === hosts.apiHost) {
    return path.startsWith('/crm/') ? url : null;
  }
  if (hosts.downloadHosts.includes(host)) {
    return path.startsWith('/crm/') || path.startsWith('/v2/crm/') ? url : null;
  }
  return null;
}

function hostOf(apiDomain: string): string {
  try {
    return new URL(apiDomain).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function decodedPath(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname).toLowerCase();
  } catch {
    return null;
  }
}

const FUNCTIONS_PATH = /\/functions(\/|$)/;

export type TokenHosts = { apiHost: string; downloadHosts: string[] };
