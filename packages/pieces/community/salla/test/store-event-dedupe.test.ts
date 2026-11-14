import { describe, expect, it } from 'vitest';
import { REVIEW_ADDED_EVENT, sallaStoreTriggers } from '../src/lib/triggers/store-event-trigger';

describe('review.added dedupe key', () => {
  const createdAt = 'Wed Jul 07 2021 14:50:48 GMT+0300';
  const base = { customer: { id: 2107468057 }, order: { id: 1289663293 } };

  it('keeps two different reviews on the same order in the same second apart', () => {
    const shipping = sallaStoreTriggers.eventDedupeKey({
      event: REVIEW_ADDED_EVENT,
      createdAt,
      data: { ...base, type: 'shipping', rating: 4, content: 'Fast delivery' },
    });
    const store = sallaStoreTriggers.eventDedupeKey({
      event: REVIEW_ADDED_EVENT,
      createdAt,
      data: { ...base, type: 'testimonial', rating: 5, content: 'Great store' },
    });
    expect(shipping).not.toBe(store);
  });

  it('gives an identical retry the same key', () => {
    const data = { ...base, type: 'shipping', rating: 4, content: 'Fast delivery' };
    expect(sallaStoreTriggers.eventDedupeKey({ event: REVIEW_ADDED_EVENT, createdAt, data })).toBe(
      sallaStoreTriggers.eventDedupeKey({ event: REVIEW_ADDED_EVENT, createdAt, data: { ...data } }),
    );
  });
});
