import { randomUUID } from 'crypto';
import {
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';

type Operation = {
  method: string;
  server: string;
  path: string;
  key: 'header' | 'query';
  query?: string[];
  body?: string[];
  binary?: boolean;
  lines?: boolean;
};

type Files = { write: (file: { fileName: string; data: Buffer }) => Promise<string> };

async function callOperation({
  apiKey,
  operation,
  values,
  files,
}: {
  apiKey: string;
  operation: Operation;
  values: Record<string, unknown>;
  files?: Files;
}): Promise<unknown> {
  const given = (name: string) => values[name] !== undefined && values[name] !== null && values[name] !== '';
  const path = operation.path.replace(/\{([a-z_]+)\}/g, (_, name: string) => {
    if (!given(name)) {
      throw new Error(`Zenrows: ${name} is empty. Check the value mapped into it.`);
    }
    return encodeURIComponent(String(values[name]));
  });
  const queryParams: Record<string, string> = {};
  for (const name of (operation.query ?? []).filter(given)) {
    queryParams[name] = String(values[name]);
  }
  if (operation.key === 'query') {
    queryParams['apikey'] = apiKey;
  }
  const body = operation.body
    ? Object.fromEntries(operation.body.filter(given).map((name) => [name, values[name]]))
    : undefined;
  try {
    const response = await httpClient.sendRequest({
      method: operation.method as HttpMethod,
      url: `${operation.server}${path}`,
      queryParams,
      headers: {
        ...(operation.key === 'header' ? { 'X-API-Key': apiKey } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...CLIENT_HEADERS,
      },
      body,
      timeout: FETCH_TIMEOUT_MS,
      ...(operation.binary ? { responseType: 'arraybuffer' as const } : {}),
      ...(operation.lines ? { responseType: 'text' as const } : {}),
    });
    if (operation.lines) {
      return readLines({ text: String(response.body ?? '') });
    }
    return operation.binary ? await readBinary({ response, files }) : response.body;
  } catch (error) {
    throw toZenrowsError({ error });
  }
}

async function readBinary({ response, files }: { response: HttpResponse; files?: Files }): Promise<unknown> {
  const data = Buffer.from(response.body as ArrayBuffer);
  const contentType = readHeader({ headers: response.headers, name: 'Content-Type' }) ?? '';
  if (contentType.includes('json')) {
    return JSON.parse(data.toString('utf8'));
  }
  if (contentType.startsWith('text/plain')) {
    return parseJsonText({ text: data.toString('utf8') });
  }
  if (contentType.startsWith('text/') || !files) {
    return data.toString('utf8');
  }
  const extension = contentType.split(';')[0].split('/')[1] || 'bin';
  return { file_url: await files.write({ fileName: `zenrows-${randomUUID()}.${extension}`, data }) };
}

function parseJsonText({ text }: { text: string }): unknown {
  if (!/^\s*[[{]/.test(text)) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readLines({ text }: { text: string }): unknown[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

async function fetchPage({
  apiKey,
  params,
  forwardedHeaders,
  responseType,
}: {
  apiKey: string;
  params: FetchParams;
  forwardedHeaders?: Record<string, string>;
  responseType: 'text' | 'arraybuffer';
}): Promise<HttpResponse> {
  try {
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${ZENROWS_API_BASE_URL}/`,
      queryParams: { apikey: apiKey, ...params },
      headers: forwardedHeaders ?? CLIENT_HEADERS,
      timeout: FETCH_TIMEOUT_MS,
      responseType,
    });
  } catch (error) {
    throw toZenrowsError({ error });
  }
}

function apiKeyHeaderFor({ apiKey, url, followRedirects }: { apiKey: string; url: unknown; followRedirects: unknown }): Record<string, string> {
  const value = typeof url === 'object' && url !== null && 'url' in url ? url.url : url;
  const target = typeof value === 'string' ? value.trim() : '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
    let parsed: URL | null = null;
    try {
      parsed = new URL(target);
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== 'https:' || !ZENROWS_API_HOSTS.includes(parsed.hostname)) {
      throw new Error(`Zenrows: Custom API Call only sends your API key to https://${ZENROWS_API_HOSTS.join(' or https://')}. Use a path such as /subscriptions/self/details, or a full URL on one of those hosts.`);
    }
  }
  if (followRedirects === true) {
    throw new Error('Zenrows: turn off Follow redirects. The Zenrows API does not redirect, and a redirect could carry your API key to another host.');
  }
  return { 'X-API-Key': apiKey };
}

function toZenrowsError({ error }: { error: unknown }): unknown {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const { status, body } = error.response;
  const problem = parseProblem({ body });
  if (!problem) {
    return error;
  }
  const hint = (problem.tag ? ERROR_HINTS[`${problem.code}:${problem.tag}`] : undefined) ?? ERROR_HINTS[problem.code];
  return new Error(`Zenrows error ${problem.code} (HTTP ${status}): ${problem.reason}${hint ? ` ${hint}` : ''}`);
}

function parseProblem({ body }: { body: unknown }): { code: string; reason: string; tag?: string } | null {
  if (typeof body === 'string') {
    try {
      return parseProblem({ body: JSON.parse(body) });
    } catch {
      return null;
    }
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }
  const { code, detail, title, reason } = body as Record<string, unknown>;
  if (typeof code !== 'string') {
    return null;
  }
  return {
    code,
    reason: typeof detail === 'string' ? detail : typeof title === 'string' ? title : 'Request failed',
    ...(typeof reason === 'string' ? { tag: reason } : {}),
  };
}

function readHeader({ headers, name }: { headers: HttpHeaders | undefined; name: string }): string | null {
  const value = headers?.[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

const FETCH_TIMEOUT_MS = 180000;

const CLIENT_HEADERS = { 'X-ZenRows-Client': 'activepieces' };

const AUTH_HINT = 'Check the API key in your Zenrows connection.';

function sentence(fact: string, next: string): string {
  return `${fact.charAt(0).toUpperCase()}${fact.slice(1)}. ${next}`;
}

const ERROR_HINTS: Record<string, string> = {
  AUTH001: AUTH_HINT,
  AUTH002: AUTH_HINT,
  AUTH003: AUTH_HINT,
  AUTH004: sentence("the account's credit allowance is spent", 'Top up or upgrade at https://app.zenrows.com.'),
  AUTH006: sentence("too many requests are running at once", 'Run fewer flows at once, or retry in a moment.'),
  AUTH014: sentence("this API key reached its credit cap", 'Raise the cap in the Zenrows dashboard.'),
  REQS002: 'This page needs JS rendering or premium proxies: turn on Adaptive Stealth Mode.',
  'REQS007:domain_not_prepared': 'Prepare the domain with Request Extract Domain, then retry once Get Extract Domain Status reports ready.',
  'REQS007:page_not_recognised': sentence("the domain is prepared, but this page has nothing Extract extracts (a home or search page, for example)", 'Point Extract at a page with the data, such as a product page.'),
};

export const ZENROWS_API_BASE_URL = "https://api.zenrows.com/v1";

export const ZENROWS_API_HOSTS = [new URL(ZENROWS_API_BASE_URL).hostname, new URL("https://async.api.zenrows.com/v1").hostname];

export const FETCH_PARAMS = {"type":"object","properties":{"url":{"type":"string","format":"uri","pattern":"^https?://","examples":["https://www.scrapingcourse.com/ecommerce/"],"description":"The URL of the page to retrieve. Only `http` and `https` URLs are accepted."},"mode":{"type":"string","enum":["auto"],"description":"Adaptive Stealth Mode. `auto` starts from the cheapest viable configuration and escalates to JavaScript rendering or premium proxies only when the target requires it. You are billed for the configuration that succeeds. It manages `js_render` and `premium_proxy` itself, so setting either alongside it answers 400 `REQS004`; `proxy_country` is allowed."},"js_render":{"type":"boolean","default":false,"description":"Render the page in a headless browser before returning it. Required for content that only exists after JavaScript runs. Not allowed with `mode=auto` (400 `REQS004`)."},"js_instructions":{"type":"string","description":"JSON array of browser instructions (click, fill, scroll, wait) executed on the page before the content is returned. Requires `js_render=true` or `mode=auto`; without either the request answers 400 `REQS004`."},"response_type":{"type":"string","enum":["markdown","plaintext","pdf"],"description":"Convert the page before returning it: Markdown, plaintext or PDF. `pdf` requires `js_render=true`; without it the request answers 400 `REQS004`. Any `response_type` together with `outputs` also answers 400 `REQS004`."},"screenshot":{"type":"boolean","default":false,"description":"Return an above-the-fold screenshot of the page. Requires `js_render=true` or `mode=auto`; without either the request answers 400 `REQS004`. Do not send it with `outputs`: the request answers 200 with no image and an empty `outputs` result."},"screenshot_fullpage":{"type":"boolean","default":false,"description":"Return a full-page screenshot. Requires js_render."},"screenshot_format":{"type":"string","enum":["png","jpeg"],"default":"png","description":"Screenshot image format."},"custom_headers":{"type":"boolean","default":false,"description":"Forward your own request headers (cookies, referer) to the target."}},"required":["url"]} as const;
export type FetchParams = Partial<Record<keyof typeof FETCH_PARAMS.properties, string>>;
export type FetchValue<P extends keyof typeof FETCH_PARAMS.properties> = (typeof FETCH_PARAMS.properties)[P] extends { enum: readonly (infer V)[] } ? V : string;

export const zenrowsClient = {
  apiKeyHeaderFor,
  callOperation,
  fetchPage,
  readHeader,
};
