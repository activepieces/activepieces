import { describe, expect, it } from 'vitest';
import { sallaApi } from '../src/lib/common/client';

const ordersSentence = 'For orders, use the internal order ID';
const genericSentence = 'Check the ID: the record may have been deleted, or the ID belongs to another store';

describe('404 hint per resource', () => {
  it('adds the order sentence on order paths', () => {
    for (const path of ['/orders/2116149737', '/orders', 'orders/7/items', '/orders?reference_id=1']) {
      const message = sallaApi.buildErrorMessage({ status: 404, responseBody: { error: { message: 'Not Found' } }, path });
      expect(message).toContain(genericSentence);
      expect(message).toContain(ordersSentence);
      expect(message).toMatch(/customers see\.$/);
    }
  });

  it('keeps only the generic sentence on other paths', () => {
    for (const path of ['/products/7', '/customers/7', '/coupons/7', '/ordersx', undefined]) {
      const message = sallaApi.buildErrorMessage({ status: 404, responseBody: { error: { message: 'Not Found' } }, path });
      expect(message).toBe(`Salla API error (404): Not Found. ${genericSentence}.`);
    }
  });
});
