import { gmailApiErrors } from '../src/lib/common/gmail-errors';

describe('gmailApiErrors', () => {
  it('reads numeric and string error codes', () => {
    expect(gmailApiErrors.getCode({ code: 404 })).toBe(404);
    expect(gmailApiErrors.getCode({ code: '429' })).toBe(429);
    expect(gmailApiErrors.getCode({ response: { status: 403 } })).toBe(403);
    expect(gmailApiErrors.getCode({ message: 'nope' })).toBeUndefined();
  });

  it('maps Gmail status codes to actionable errors', () => {
    expect(() =>
      gmailApiErrors.throwForAction({
        error: { code: 403 },
        action: 'add a label to the email',
        scopeHint: 'gmail.modify',
      })
    ).toThrow(/gmail.modify/);

    expect(() =>
      gmailApiErrors.throwForAction({
        error: { code: 404 },
        action: 'archive the email',
        scopeHint: 'gmail.modify',
        notFoundMessage: 'missing message',
      })
    ).toThrow('missing message');

    expect(() =>
      gmailApiErrors.throwForAction({
        error: { code: 409 },
        action: 'create a label',
        scopeHint: 'gmail.labels',
        conflictMessage: 'label exists',
      })
    ).toThrow('label exists');

    expect(() =>
      gmailApiErrors.throwForAction({
        error: { code: 429 },
        action: 'list history',
        scopeHint: 'gmail.readonly',
      })
    ).toThrow(/rate limit/);
  });
});
