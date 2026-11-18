import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';

const MAX_DOMAIN_PAGES = 20;
const DOMAIN_PAGE_SIZE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function scrubLink(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) {
    return {};
  }
  const { password: _password, User: user, ...rest } = raw;
  const owner = isRecord(user) ? { User: Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'photoURL')) } : {};
  const idString = typeof rest['idString'] === 'string' ? rest['idString'] : undefined;
  return { ...rest, ...owner, ...(idString ? { linkId: idString } : {}) };
}

function scrubLinks(raw: unknown): Record<string, unknown>[] {
  return Array.isArray(raw) ? raw.map(scrubLink) : [];
}

function parseDomainProp(value: unknown): ShortIoDomainRef {
  const parsed: unknown = typeof value === 'string' ? safeJson(value) : value;
  if (isRecord(parsed)) {
    const id = Number(parsed['id']);
    const hostname = typeof parsed['hostname'] === 'string' ? parsed['hostname'] : '';
    if (Number.isInteger(id) && id > 0 && hostname) {
      return { id, hostname };
    }
  }
  throw new Error('Select a domain from the Domain dropdown.');
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeHostname(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

async function listAllDomains(auth: ShortIoAuthValue): Promise<Record<string, unknown>[]> {
  const pages: Record<string, unknown>[][] = [];
  for (let page = 0; page < MAX_DOMAIN_PAGES; page++) {
    const batch = await shortIoClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/api/domains',
      query: { limit: DOMAIN_PAGE_SIZE, offset: page * DOMAIN_PAGE_SIZE },
    });
    const items = Array.isArray(batch) ? batch.filter(isRecord) : [];
    pages.push(items);
    if (items.length < DOMAIN_PAGE_SIZE) {
      break;
    }
  }
  return pages.flat();
}

async function resolveDomain({ auth, input }: { auth: ShortIoAuthValue; input: string | undefined }): Promise<ShortIoDomainRef> {
  const text = (input ?? '').trim();
  if (!text) {
    throw new Error('Domain is required: give the domain hostname (e.g. link.example.com) or its numeric ID.');
  }
  const domains = await listAllDomains(auth);
  const wanted = normalizeHostname(text);
  const match = domains.find((domain) =>
    /^\d+$/.test(text)
      ? String(domain['id']) === text
      : [domain['hostname'], domain['unicodeHostname']].some((name) => typeof name === 'string' && name.toLowerCase() === wanted),
  );
  if (!match) {
    const known = domains
      .map((domain) => domain['hostname'])
      .filter((name): name is string => typeof name === 'string')
      .slice(0, 20);
    throw new Error(
      known.length === 0
        ? 'This Short.io account has no domains. Add a domain in Short.io first.'
        : `Domain "${text}" was not found on this Short.io account. Known domains: ${known.join(', ')}.`,
    );
  }
  return { id: Number(match['id']), hostname: String(match['hostname']) };
}

function parseShortUrl(input: string): { hostname?: string; path: string } {
  const text = input.trim();
  if (/^https?:\/\//i.test(text) || /^[^/\s]+\.[^/\s]+\/.+/.test(text)) {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return { hostname: url.hostname.toLowerCase(), path: decodeURIComponent(url.pathname.replace(/^\/+/, '')) };
  }
  return { path: text.replace(/^\/+/, '') };
}

const DOMAIN_KEYS = ['id', 'hostname', 'unicodeHostname', 'state', 'linkType', 'cloaking', 'caseSensitive', 'redirect404', 'httpsLinks', 'TeamId', 'createdAt', 'updatedAt'];

function pickDomain(raw: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(DOMAIN_KEYS.filter((key) => key in raw).map((key) => [key, raw[key]]));
}

export const shortIoLinks = {
  pickDomain,
  scrubLink,
  scrubLinks,
  parseDomainProp,
  resolveDomain,
  listAllDomains,
  parseShortUrl,
  isRecord,
};

export type ShortIoDomainRef = { id: number; hostname: string };
