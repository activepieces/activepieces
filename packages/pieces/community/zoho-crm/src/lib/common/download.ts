import { Readable, Transform, pipeline } from 'node:stream';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import { ZohoAuth, ZohoCrmError, authHeaders, getApiDomain, toZohoError } from './client';
import { TokenHosts, tokenHosts, zohoTokenUrl } from './host-guard';

export async function downloadToFile({
  auth,
  url,
  files,
  fileName,
  fallbackName,
}: {
  auth: ZohoAuth;
  url: string;
  files: FilesService;
  fileName?: string;
  fallbackName?: string;
}): Promise<DownloadedFile> {
  const hosts = tokenHosts(getApiDomain(auth));
  const first = zohoTokenUrl({ raw: url, hosts });
  if (!first) {
    throw new ZohoCrmError(
      `Refusing to send the Zoho CRM token to "${url}": the URL must be an https link to this connection's Zoho API (https://${hosts.apiHost}/crm/...)${
        hosts.downloadHosts.length > 0 ? ` or its download host (https://${hosts.downloadHosts[0]}/...)` : ''
      }.`,
    );
  }
  const response = await openDownload({ url: first, hosts, accessToken: auth.access_token });
  const name = fileName ?? fileNameFromDisposition({ header: response.headers['content-disposition'], fallback: fallbackName ?? lastPathSegment(first) });
  const counted = countBytes(response.body);
  const file = await files.write({ fileName: name, data: counted.stream }).catch((error: unknown) => {
    counted.stream.destroy();
    response.body.destroy();
    throw error;
  });
  const contentType = response.headers['content-type'];
  return { file, fileName: name, size: counted.total(), contentType: typeof contentType === 'string' ? contentType : null };
}

export function fileNameFromDisposition({ header, fallback }: { header: unknown; fallback: string }): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') return fallback;
  const star = /filename\*=(?:[\w!#$%&+^`{}~-]+'[\w-]*')?([^;]+)/i.exec(value);
  const plain = /filename="?([^";]+)"?/i.exec(value);
  const raw = star ? safeDecode(star[1].trim().replace(/^"|"$/g, '')) : plain ? plain[1].trim() : undefined;
  return (raw === undefined ? undefined : safeFileName(raw)) ?? fallback;
}

export function lastPathSegment(url: URL): string {
  const last = url.pathname.split('/').filter((part) => part.length > 0).pop();
  return (last === undefined ? undefined : safeFileName(safeDecode(last))) ?? 'zoho-file';
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeFileName(raw: string): string | undefined {
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.length === 0 || /^\.+$/.test(cleaned) ? undefined : cleaned.slice(0, 200);
}

async function openDownload({ url, hosts, accessToken }: { url: URL; hosts: TokenHosts; accessToken: string }): Promise<OpenedDownload> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const withToken = zohoTokenUrl({ raw: current.toString(), hosts }) !== null;
    let response;
    try {
      response = await httpClient.sendRequest<Readable | Buffer | undefined>({
        method: HttpMethod.GET,
        url: current.toString(),
        headers: withToken ? authHeaders({ access_token: accessToken }) : {},
        responseType: 'stream',
        followRedirects: false,
        timeout: REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      throw toZohoError(error);
    }
    const body = toReadable(response.body);
    const headers = response.headers ?? {};
    if (response.status >= 300 && response.status < 400) {
      body.destroy();
      current = redirectTarget({ location: headers['location'], base: current, status: response.status, hosts });
      continue;
    }
    if (response.status === 204) {
      body.destroy();
      throw new ZohoCrmError('Zoho returned no file content (a link attachment has no file to download).');
    }
    return { body, headers };
  }
  throw new ZohoCrmError(`The download was redirected more than ${MAX_REDIRECTS} times, so it was stopped.`);
}

function redirectTarget({ location, base, status, hosts }: { location: unknown; base: URL; status: number; hosts: TokenHosts }): URL {
  const value = Array.isArray(location) ? location[0] : location;
  if (typeof value !== 'string' || value.length === 0) {
    throw new ZohoCrmError(`Zoho answered HTTP ${status} without a Location header.`);
  }
  let target: URL;
  try {
    target = new URL(value, base);
  } catch {
    throw new ZohoCrmError(`Zoho redirected the download to an address that is not a valid link.`);
  }
  if (target.protocol !== 'https:') {
    throw new ZohoCrmError(`Zoho redirected the download to a non-https address, so it was stopped.`);
  }
  if (!isFileHost({ url: target, hosts })) {
    throw new ZohoCrmError(`Zoho redirected the download to ${target.host}, which is not one of this connection's Zoho CRM file hosts, so it was stopped.`);
  }
  return target;
}

function isFileHost({ url, hosts }: { url: URL; hosts: TokenHosts }): boolean {
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const standardPort = url.port === '' || url.port === '443';
  const noUserInfo = url.username === '' && url.password === '';
  return standardPort && noUserInfo && (host === hosts.apiHost || hosts.downloadHosts.includes(host));
}

function toReadable(body: Readable | Buffer | undefined): Readable {
  if (body === undefined) return Readable.from([]);
  if (Buffer.isBuffer(body)) return Readable.from([body]);
  return body;
}

function countBytes(body: Readable): { stream: Readable; total: () => number } {
  let total = 0;
  let idleTimer: NodeJS.Timeout | undefined;
  const clearIdleTimer = (): void => {
    if (idleTimer !== undefined) {
      clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  };
  const counter = new Transform({
    transform(chunk: unknown, _encoding, callback) {
      armIdleTimer();
      const bytes = Buffer.isBuffer(chunk) ? chunk : chunk instanceof Uint8Array ? Buffer.from(chunk) : Buffer.from(String(chunk));
      total += bytes.length;
      callback(null, bytes);
    },
    flush(callback) {
      clearIdleTimer();
      callback();
    },
    destroy(error, callback) {
      clearIdleTimer();
      callback(error);
    },
  });
  const armIdleTimer = (): void => {
    clearIdleTimer();
    idleTimer = setTimeout(() => counter.destroy(new ZohoCrmError(`The download stalled for ${IDLE_TIMEOUT_MS / 1000} seconds.`)), IDLE_TIMEOUT_MS);
  };
  armIdleTimer();
  const stream = pipeline(body, counter, () => clearIdleTimer());
  return { stream, total: () => total };
}

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 60_000;
const IDLE_TIMEOUT_MS = 60_000;

type OpenedDownload = { body: Readable; headers: Record<string, unknown> };

export type DownloadedFile = { file: string; fileName: string; size: number; contentType: string | null };
