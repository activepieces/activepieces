import { createHash } from 'node:crypto';

/**
 * PayFast signature algorithm.
 * 1. Take all fields except signature.
 * 2. URL-encode each value (spaces become +).
 * 3. Join as key=value pairs with & in the original order.
 * 4. If a passphrase is set, append &passphrase=<urlencoded-passphrase>.
 * 5. MD5 hash the entire string, hex output.
 */
export function payfastSignature(
  data: Record<string, string | number | undefined | null>,
  passphrase: string,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'signature') continue;
    if (value === undefined || value === null) continue;
    const encoded = encodeURIComponent(String(value)).replace(/%20/g, '+');
    parts.push(`${key}=${encoded}`);
  }
  let toHash = parts.join('&');
  if (passphrase && passphrase.length > 0) {
    const encodedPass = encodeURIComponent(passphrase).replace(/%20/g, '+');
    toHash += `&passphrase=${encodedPass}`;
  }
  return createHash('md5').update(toHash).digest('hex');
}

export function payfastBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';
}

export function payfastApiBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://sandbox.payfast.co.za'
    : 'https://api.payfast.co.za';
}
