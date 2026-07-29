export function isPubliclyReachable(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
  if (isPrivateIpv4(host)) return false;
  if (host.includes(':') || host.startsWith('[')) return !isPrivateIpv6(host);
  return true;
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = nums;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function mappedIpv4(host: string): string | undefined {
  const match = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(host);
  if (!match) return undefined;
  const high = Number.parseInt(match[1] ?? '', 16);
  const low = Number.parseInt(match[2] ?? '', 16);
  if (!Number.isInteger(high) || !Number.isInteger(low)) return undefined;
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

function isUniqueLocalOrLinkLocalIpv6(host: string): boolean {
  return /^f[cd][0-9a-f]{2}:/.test(host) || /^fe[89ab][0-9a-f]:/.test(host);
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === '::1' || h === '::') return true;
  if (isUniqueLocalOrLinkLocalIpv6(h)) return true;
  const mapped = mappedIpv4(h);
  if (mapped !== undefined) return isPrivateIpv4(mapped);
  return false;
}

const PRIVATE_SUFFIXES = ['.local', '.internal', '.localdomain'];
