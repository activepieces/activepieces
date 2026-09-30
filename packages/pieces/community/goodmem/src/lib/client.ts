import { Goodmem, GoodmemConfig } from '@pairsystems/goodmem';

export function createGoodmemClient(
  auth: Pick<GoodmemConfig, 'baseUrl' | 'apiKey'>
): Goodmem {
  return new Goodmem({ ...auth, timeoutMs: 60_000 });
}
