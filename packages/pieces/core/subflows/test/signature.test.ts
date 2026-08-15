/// <reference types="vitest/globals" />

import { signSubflowPayload, verifySubflowSignature } from '../src/lib/common';

const SECRET = 'project-a-secret';
const OTHER_SECRET = 'project-b-secret';

describe('subflow payload signature', () => {
  it('verifies a payload signed with the same secret', () => {
    const payload = { data: { hello: 'world', n: 1 }, callbackUrl: 'https://cb' };
    const signature = signSubflowPayload({ secret: SECRET, payload });
    expect(verifySubflowSignature({ secret: SECRET, payload, signature })).toBe(true);
  });

  it('rejects a payload signed with a different (cross-project) secret', () => {
    const payload = { data: { hello: 'world' } };
    const signature = signSubflowPayload({ secret: OTHER_SECRET, payload });
    expect(verifySubflowSignature({ secret: SECRET, payload, signature })).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const payload = { data: { amount: 10 } };
    const signature = signSubflowPayload({ secret: SECRET, payload });
    const tampered = { data: { amount: 1000 } };
    expect(verifySubflowSignature({ secret: SECRET, payload: tampered, signature })).toBe(false);
  });

  it('rejects a missing signature', () => {
    const payload = { data: {} };
    expect(verifySubflowSignature({ secret: SECRET, payload, signature: undefined })).toBe(false);
  });

  it('is independent of object key order', () => {
    const signature = signSubflowPayload({ secret: SECRET, payload: { data: { a: 1, b: 2 } } });
    const reordered = { data: { b: 2, a: 1 } };
    expect(verifySubflowSignature({ secret: SECRET, payload: reordered, signature })).toBe(true);
  });

  it('treats an absent optional field the same as an undefined one (callbackUrl omitted on the wire)', () => {
    const signed = signSubflowPayload({ secret: SECRET, payload: { data: { x: 1 }, callbackUrl: undefined } });
    const received = { data: { x: 1 } };
    expect(verifySubflowSignature({ secret: SECRET, payload: received, signature: signed })).toBe(true);
  });
});
