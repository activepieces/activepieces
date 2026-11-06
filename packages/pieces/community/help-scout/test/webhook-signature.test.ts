import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { helpScoutApi } from '../src/lib/common/api';

const secret = 'test-secret';
const rawBody = '{"id":1234,"subject":"Hello"}';
const sign = (body: string) => crypto.createHmac('sha1', secret).update(body).digest('base64');

describe('verifyWebhookSignature', () => {
  it('accepts a genuine signature', () => {
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: sign(rawBody), rawBody })).toBe(true);
  });
  it('accepts a known vector', () => {
    const signature = crypto.createHmac('sha1', 'key').update('The quick brown fox jumps over the lazy dog').digest('base64');
    expect(signature).toBe('3nybhbi3iqa8ino29wqQcBydtNk=');
    expect(helpScoutApi.verifyWebhookSignature({ secret: 'key', signature, rawBody: 'The quick brown fox jumps over the lazy dog' })).toBe(true);
  });
  it('accepts a Buffer raw body', () => {
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: sign(rawBody), rawBody: Buffer.from(rawBody) })).toBe(true);
  });
  it('rejects a forged "zz" header', () => {
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: 'zz', rawBody })).toBe(false);
  });
  it('rejects a tampered body', () => {
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: sign(rawBody), rawBody: rawBody.replace('Hello', 'Hellp') })).toBe(false);
  });
  it('rejects a wrong secret', () => {
    const signature = crypto.createHmac('sha1', 'other').update(rawBody).digest('base64');
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature, rawBody })).toBe(false);
  });
  it('rejects missing header, secret or raw body', () => {
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: undefined, rawBody })).toBe(false);
    expect(helpScoutApi.verifyWebhookSignature({ secret: undefined, signature: sign(rawBody), rawBody })).toBe(false);
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: sign(rawBody), rawBody: undefined })).toBe(false);
    expect(helpScoutApi.verifyWebhookSignature({ secret, signature: sign(rawBody), rawBody: { id: 1 } })).toBe(false);
  });
  it('verifiedWebhookBody reads the header case-insensitively and rejects bad signatures', () => {
    const stored = { webhookId: '1', WebhookSecret: secret };
    const body = { id: 1234 };
    expect(helpScoutApi.verifiedWebhookBody({ stored, headers: { 'X-HelpScout-Signature': sign(rawBody) }, rawBody, body })).toEqual(body);
    expect(helpScoutApi.verifiedWebhookBody({ stored, headers: { 'x-helpscout-signature': 'zz' }, rawBody, body })).toBeUndefined();
    expect(helpScoutApi.verifiedWebhookBody({ stored: null, headers: { 'x-helpscout-signature': sign(rawBody) }, rawBody, body })).toBeUndefined();
  });
  it('matchesAssignee does not crash on unassigned conversations', () => {
    expect(helpScoutApi.matchesAssignee({ body: {}, assignedTo: '5' })).toBe(false);
    expect(helpScoutApi.matchesAssignee({ body: { assignee: null }, assignedTo: '5' })).toBe(false);
    expect(helpScoutApi.matchesAssignee({ body: {}, assignedTo: undefined })).toBe(true);
    expect(helpScoutApi.matchesAssignee({ body: { assignee: { id: 5 } }, assignedTo: '5' })).toBe(true);
  });
});
