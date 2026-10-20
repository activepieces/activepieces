import { vi } from 'vitest';

vi.mock('dns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('dns')>();
  const fakeDns: Record<string, string> = {
    'private.example.com': '10.0.0.5',
    'metadata.example.com': '169.254.169.254',
    'mapped.example.com': '::ffff:a00:5',
    'mapped-dotted.example.com': '::ffff:127.0.0.1',
    'ula.example.com': 'fd12::1',
  };
  const lookup = (hostname: string, _options: unknown, callback: (error: Error | null, addresses: Array<{ address: string; family: number }>) => void) => {
    const address = fakeDns[hostname] ?? '93.184.215.14';
    callback(null, [{ address, family: address.includes(':') ? 6 : 4 }]);
  };
  return { ...actual, default: { ...actual, lookup }, lookup };
});
