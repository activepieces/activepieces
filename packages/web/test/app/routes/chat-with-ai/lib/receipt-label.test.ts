import { ActionReceiptEvent } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { deriveReceiptLabel } from '@/app/routes/chat-with-ai/lib/receipt-label';

function makeReceipt(
  output: unknown,
  actionDisplayName = 'Create Record',
): ActionReceiptEvent {
  return {
    toolCallId: 't1',
    actionDisplayName,
    pieceName: '@activepieces/piece-gmail',
    status: 'success',
    output,
    timestamp: '2026-06-30T10:00:00.000Z',
  };
}

describe('deriveReceiptLabel', () => {
  it('uses a top-level human key from an object output', () => {
    expect(deriveReceiptLabel(makeReceipt({ subject: 'Welcome' }))).toBe(
      'Welcome',
    );
  });

  it('prefers higher-priority keys (to before subject)', () => {
    expect(
      deriveReceiptLabel(
        makeReceipt({ subject: 'Welcome', to: 'alice@acme.com' }),
      ),
    ).toBe('alice@acme.com');
  });

  it('parses a JSON string output', () => {
    expect(deriveReceiptLabel(makeReceipt('{"email":"bob@acme.com"}'))).toBe(
      'bob@acme.com',
    );
  });

  it('joins array values', () => {
    expect(
      deriveReceiptLabel(makeReceipt({ to: ['a@x.com', 'b@x.com'] })),
    ).toBe('a@x.com, b@x.com');
  });

  it('looks one level into nested objects', () => {
    expect(
      deriveReceiptLabel(makeReceipt({ data: { title: 'Acme Inc' } })),
    ).toBe('Acme Inc');
  });

  it('uses a numeric id rendered as a string', () => {
    expect(deriveReceiptLabel(makeReceipt({ id: 42 }))).toBe('42');
  });

  it('ignores blank values and continues scanning', () => {
    expect(deriveReceiptLabel(makeReceipt({ to: '   ', subject: 'Hi' }))).toBe(
      'Hi',
    );
  });

  it('falls back to actionDisplayName when no key matches', () => {
    expect(deriveReceiptLabel(makeReceipt({ foo: 'bar' }, 'Send Email'))).toBe(
      'Send Email',
    );
  });

  it('falls back when output is null', () => {
    expect(deriveReceiptLabel(makeReceipt(null, 'Send Email'))).toBe(
      'Send Email',
    );
  });

  it('falls back when output is a non-JSON string', () => {
    expect(deriveReceiptLabel(makeReceipt('ok', 'Send Email'))).toBe(
      'Send Email',
    );
  });
});
