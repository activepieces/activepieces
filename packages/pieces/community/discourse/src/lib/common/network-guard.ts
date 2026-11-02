import { isIP } from 'net';
import { lookup as dnsLookup, LookupAddress, LookupOptions } from 'dns';

function parseIpv4(ip: string): number[] | undefined {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (match === null) {
    return undefined;
  }
  const octets = match.slice(1).map(Number);
  return octets.every((octet) => octet <= 255) ? octets : undefined;
}

function isBlockedIpv4(octets: number[]): boolean {
  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function expandIpv6(ip: string): number[] | undefined {
  let text = ip.toLowerCase().split('%')[0];
  const tailV4 = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(text);
  if (tailV4 !== null) {
    const octets = parseIpv4(tailV4[1]);
    if (octets === undefined) {
      return undefined;
    }
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    text = `${text.slice(0, -tailV4[1].length)}${high}:${low}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) {
    return undefined;
  }
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const tail = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) {
    return undefined;
  }
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return undefined;
  }
  return groups.map((group) => parseInt(group, 16));
}

function embeddedIpv4(groups: number[]): number[] {
  return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff];
}

function isBlockedIpv6(groups: number[]): boolean {
  const firstSixZero = groups.slice(0, 6).every((group) => group === 0);
  if (firstSixZero) {
    return true;
  }
  const mapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mapped) {
    return isBlockedIpv4(embeddedIpv4(groups));
  }
  if (groups[0] === 0x64 && groups[1] === 0xff9b) {
    return true;
  }
  if (groups[0] === 0x2002) {
    return isBlockedIpv4([groups[1] >> 8, groups[1] & 0xff, groups[2] >> 8, groups[2] & 0xff]);
  }
  return (
    (groups[0] & 0xfe00) === 0xfc00 ||
    (groups[0] & 0xffc0) === 0xfe80 ||
    (groups[0] & 0xffc0) === 0xfec0 ||
    (groups[0] & 0xff00) === 0xff00 ||
    (groups[0] === 0x2001 && groups[1] === 0x0db8) ||
    (groups[0] === 0x2001 && groups[1] === 0)
  );
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip.split('%')[0]);
  if (version === 4) {
    const octets = parseIpv4(ip);
    return octets === undefined || isBlockedIpv4(octets);
  }
  if (version === 6) {
    const groups = expandIpv6(ip);
    return groups === undefined || isBlockedIpv6(groups);
  }
  return true;
}

export class BlockedAddressError extends Error {
  constructor(hostname: string) {
    super(`The Website URL host "${hostname}" resolves to a local or private network address, which is not allowed.`);
    this.name = 'BlockedAddressError';
  }
}

type LookupCallback = (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

function guardedLookup(hostname: string, options: LookupOptions, callback: LookupCallback): void {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, []);
      return;
    }
    const list: LookupAddress[] = Array.isArray(addresses) ? addresses : [];
    if (list.length === 0 || list.some((entry) => isBlockedIp(entry.address))) {
      callback(Object.assign(new BlockedAddressError(hostname), { code: 'EBLOCKEDADDRESS' }), []);
      return;
    }
    if (options.all === true) {
      callback(null, list);
      return;
    }
    callback(null, list[0].address, list[0].family);
  });
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) !== 0) {
    if (isBlockedIp(host)) {
      throw new BlockedAddressError(hostname);
    }
    return;
  }
  await new Promise<void>((resolve, reject) => {
    guardedLookup(host, { all: true }, (error) => (error ? reject(error) : resolve()));
  });
}

let guardedDispatcher: Promise<unknown> | undefined;

function getGuardedDispatcher(): Promise<unknown> {
  guardedDispatcher ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true, lookup: guardedLookup } }),
  );
  return guardedDispatcher;
}

export const discourseNetwork = { isBlockedIp, guardedLookup, assertPublicHost, getGuardedDispatcher };
