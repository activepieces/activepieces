import { lookup, LookupAddress, LookupOptions } from 'node:dns';
import { IncomingMessage, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { BlockList, isIP } from 'node:net';

const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = [301, 302, 303, 307, 308];
const USER_AGENT = 'Mozilla/5.0 (compatible; Activepieces-Bot/1.0)';
const BLOCKED_IPV4_SUBNETS: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];
const BLOCKED_IPV6_SUBNETS: [string, number][] = [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 32],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
];

const blockList = buildBlockList();

function buildBlockList(): BlockList {
  const list = new BlockList();
  for (const [network, prefix] of BLOCKED_IPV4_SUBNETS) {
    list.addSubnet(network, prefix, 'ipv4');
  }
  for (const [network, prefix] of BLOCKED_IPV6_SUBNETS) {
    list.addSubnet(network, prefix, 'ipv6');
  }
  return list;
}

function isBlockedAddress(address: string): boolean {
  const bare = address.replace(/^\[|\]$/g, '');
  const version = isIP(bare);
  if (version === 4) {
    return blockList.check(bare, 'ipv4');
  }
  if (version === 6) {
    const mapped = mappedIpv4(bare);
    return mapped === undefined ? blockList.check(bare, 'ipv6') : blockList.check(mapped, 'ipv4');
  }
  return true;
}

function mappedIpv4(address: string): string | undefined {
  const dotted = address.match(/^(?:0{0,4}:){0,5}:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (dotted) {
    return dotted[1];
  }
  const hex = address.match(/^(?:0{0,4}:){0,5}:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!hex) {
    return undefined;
  }
  const high = parseInt(hex[1], 16);
  const low = parseInt(hex[2], 16);
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

function guardedLookup({
  hostname,
  options,
  callback,
}: {
  hostname: string;
  options: LookupOptions;
  callback: (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;
}): void {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, '', 0);
      return;
    }
    const blocked = addresses.find((entry) => blueskyDownload.isBlockedAddress(entry.address));
    if (blocked !== undefined || addresses.length === 0) {
      callback(new PrivateAddressError({ host: hostname, address: blocked?.address }), '', 0);
      return;
    }
    if (options.all) {
      callback(null, addresses);
      return;
    }
    callback(null, addresses[0].address, addresses[0].family);
  });
}

function parseHttpUrl({ url, label }: { url: string; label: string }): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} "${url}" is not a valid URL.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} "${url}" must start with http:// or https://.`);
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error(`${label} "${url}" must not contain a username or password.`);
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) !== 0 && blueskyDownload.isBlockedAddress(host)) {
    throw new PrivateAddressError({ host, address: host });
  }
  return parsed;
}

async function download({
  url,
  maxBytes,
  timeoutMs,
  accept,
  label,
}: {
  url: string;
  maxBytes: number;
  timeoutMs: number;
  accept: string;
  label: string;
}): Promise<{ data: Uint8Array; contentType: string }> {
  const deadline = Date.now() + timeoutMs;
  let target = parseHttpUrl({ url, label });
  for (let hop = 0; ; hop++) {
    const response = await openOrFail({ target, accept, deadline, timeoutMs, url, label });
    const status = response.statusCode ?? 0;
    if (REDIRECT_STATUSES.includes(status)) {
      response.destroy();
      const location = headerValue(response.headers['location']);
      if (location === undefined) {
        throw new Error(`Could not download ${label} from ${url}: HTTP ${status} without a Location header.`);
      }
      if (hop >= MAX_REDIRECTS) {
        throw new Error(`Could not download ${label} from ${url}: more than ${MAX_REDIRECTS} redirects.`);
      }
      target = redirectTarget({ location, base: target, url, label });
      continue;
    }
    if (status < 200 || status >= 300) {
      response.destroy();
      throw new Error(`Could not download ${label} from ${url}: HTTP ${status}.`);
    }
    const declared = Number(headerValue(response.headers['content-length']) ?? '');
    if (Number.isFinite(declared) && declared > maxBytes) {
      response.destroy();
      throw new Error(`${label} at ${url} is ${formatBytes(declared)}; the limit is ${formatBytes(maxBytes)}.`);
    }
    const data = await readCapped({ stream: response, maxBytes, url, label, deadline, timeoutMs });
    const contentType = headerValue(response.headers['content-type']) ?? '';
    return { data, contentType: contentType.split(';')[0].trim().toLowerCase() };
  }
}

function redirectTarget({ location, base, url, label }: { location: string; base: URL; url: string; label: string }): URL {
  let next: string;
  try {
    next = new URL(location, base).href;
  } catch {
    throw new Error(`Could not download ${label} from ${url}: the redirect location "${location}" is not a valid URL.`);
  }
  try {
    return parseHttpUrl({ url: next, label: `${label} redirect` });
  } catch (error) {
    throw new Error(`Could not download ${label} from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function openOrFail({
  target,
  accept,
  deadline,
  timeoutMs,
  url,
  label,
}: {
  target: URL;
  accept: string;
  deadline: number;
  timeoutMs: number;
  url: string;
  label: string;
}): Promise<IncomingMessage> {
  try {
    return await open({ target, accept, deadline, timeoutMs });
  } catch (error) {
    throw new Error(`Could not download ${label} from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function open({ target, accept, deadline, timeoutMs }: { target: URL; accept: string; deadline: number; timeoutMs: number }): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      reject(timeoutError(timeoutMs));
      return;
    }
    const headers = { 'User-Agent': USER_AGENT, Accept: accept };
    const onResponse = (response: IncomingMessage): void => {
      clearTimeout(timer);
      resolve(response);
    };
    const request =
      target.protocol === 'https:'
        ? httpsRequest(
            target,
            {
              method: 'GET',
              headers,
              agent: false,
              rejectUnauthorized: true,
              lookup: (hostname, options, callback) => guardedLookup({ hostname, options, callback }),
            },
            onResponse,
          )
        : httpRequest(
            target,
            { method: 'GET', headers, agent: false, lookup: (hostname, options, callback) => guardedLookup({ hostname, options, callback }) },
            onResponse,
          );
    const timer = setTimeout(() => {
      request.destroy(timeoutError(timeoutMs));
    }, remaining);
    request.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    request.end();
  });
}

async function readCapped({
  stream,
  maxBytes,
  url,
  label,
  deadline,
  timeoutMs,
}: {
  stream: IncomingMessage;
  maxBytes: number;
  url: string;
  label: string;
  deadline: number;
  timeoutMs: number;
}): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  let total = 0;
  let tooLarge = false;
  const timer = setTimeout(() => {
    stream.destroy(timeoutError(timeoutMs));
  }, Math.max(1, deadline - Date.now()));
  try {
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.byteLength;
      if (total > maxBytes) {
        tooLarge = true;
        break;
      }
      chunks.push(buffer);
    }
  } catch (error) {
    throw new Error(`Could not download ${label} from ${url}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timer);
    if (tooLarge) {
      stream.destroy();
    }
  }
  if (tooLarge) {
    throw new Error(`${label} at ${url} is larger than the ${formatBytes(maxBytes)} limit.`);
  }
  return new Uint8Array(Buffer.concat(chunks, total));
}

function timeoutError(timeoutMs: number): Error {
  return new Error(`timed out after ${Math.round(timeoutMs / 1000)} s`);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatBytes(bytes: number): string {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;
}

class PrivateAddressError extends Error {
  constructor({ host, address }: { host: string; address: string | undefined }) {
    super(
      address === undefined || address === host
        ? `${host} is a private, loopback or internal address; only public internet addresses can be downloaded.`
        : `${host} resolves to ${address}, a private, loopback or internal address; only public internet addresses can be downloaded.`,
    );
    this.name = 'PrivateAddressError';
  }
}

export const blueskyDownload = {
  MAX_REDIRECTS,
  download,
  isBlockedAddress,
  guardedLookup,
  parseHttpUrl,
};
