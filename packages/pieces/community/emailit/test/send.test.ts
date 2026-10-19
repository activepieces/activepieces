import { afterEach, describe, expect, test, vi } from 'vitest';
import { sendEmailAction } from '../src/lib/actions/send-email';
import { sendEmailAiAction } from '../src/lib/actions/send-email-ai';
import { failure, replies, run, SEND_REPLY, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const base = { from_email: 'hello@acme.com', subject: 'Hi', content_type: 'html', content: '<p>Hi</p>' };

describe('send_email (existing action)', () => {
  test('keeps the old request for the old props and returns {status, headers, body}', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY, headers: { 'ratelimit-remaining': '9' } }]));
    const result = await run({ action: sendEmailAction, props: { ...base, from_name: 'Acme', to: ['ada@example.com'], headers: { 'X-Campaign-ID': 'welcome' } } });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url.toString()).toBe('https://api.emailit.com/v2/emails');
    expect(seen[0].body).toEqual({ from: '"Acme" <hello@acme.com>', to: ['ada@example.com'], subject: 'Hi', html: '<p>Hi</p>', headers: { 'X-Campaign-ID': 'welcome' } });
    expect(seen[0].headers.get('idempotency-key')).toBeNull();
    expect(result).toMatchObject({ status: 200, body: { id: 'em_1' }, headers: { 'ratelimit-remaining': '9' } });
  });
  test('plain-text content goes in text; the plain-text version goes with HTML', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], content_type: 'text', content: 'hello' } });
    expect(seen[0].body).toMatchObject({ text: 'hello' });
    expect(seen[0].body).not.toHaveProperty('html');
    await run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], plain_text: 'Hi (text)' } });
    expect(seen[1].body).toMatchObject({ html: '<p>Hi</p>', text: 'Hi (text)' });
  });
  test('recipients are trimmed, split on commas, and empty entries dropped', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await run({ action: sendEmailAction, props: { ...base, to: [' ada@example.com ', '', 'b@x.io, c@x.io'], cc: [''], reply_to: 'r1@x.io, r2@x.io' } });
    expect(seen[0].body).toMatchObject({ to: ['ada@example.com', 'b@x.io', 'c@x.io'], reply_to: ['r1@x.io', 'r2@x.io'] });
    expect(seen[0].body).not.toHaveProperty('cc');
  });
  test('a comma inside a quoted display name is not split; Emailit rejects it, so the step explains why', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['"Doe, Jane" <jane@example.com>'] } })).rejects.toThrow('comma inside a display name');
    await run({ action: sendEmailAction, props: { ...base, to: ['"Jane Doe" <jane@example.com>, a@x.io'], reply_to: '"Support" <s@x.io>, b@x.io' } });
    expect(seen).toHaveLength(1);
    expect(seen[0].body).toMatchObject({ to: ['"Jane Doe" <jane@example.com>', 'a@x.io'], reply_to: ['"Support" <s@x.io>', 'b@x.io'] });
  });
  test('a sender name Emailit would reject fails clearly instead of being changed', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], from_name: 'Acme "Support"' } })).rejects.toThrow('Sender Name cannot contain quotes');
    await run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], from_name: 'Acme Support, EU' } });
    expect(seen).toHaveLength(1);
    expect(seen[0].body).toMatchObject({ from: '"Acme Support, EU" <hello@acme.com>' });
  });
  test('the 50-address limit applies per field, not combined', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    const fifty = Array.from({ length: 50 }, (_, index) => `u${index}@x.io`);
    await run({ action: sendEmailAction, props: { ...base, to: fifty, cc: fifty, bcc: fifty } });
    expect(seen).toHaveLength(1);
    await expect(run({ action: sendEmailAction, props: { ...base, to: [...fifty, 'one-more@x.io'] } })).rejects.toThrow('at most 50');
    expect(seen).toHaveLength(1);
  });
  test('header injection is refused before any request', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], headers: { 'X-A': 'ok\r\nBcc: victim@x.io' } } })).rejects.toThrow('line breaks');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], headers: { 'X A\n': 'v' } } })).rejects.toThrow('not a valid header name');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], from_name: 'Evil\r\nBcc: x' } })).rejects.toThrow('line breaks');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co\nBcc: x@y.z'] } })).rejects.toThrow('line breaks');
    expect(seen).toHaveLength(0);
  });
  test('idempotency key, schedule, template, variables, meta, tracking and attachments are sent', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await run({
      action: sendEmailAction,
      props: {
        from_email: 'hello@acme.com',
        content_type: 'html',
        to: ['a@b.co'],
        template: 'welcome',
        variables: { first_name: 'Ada' },
        meta: { order_id: 1042 },
        scheduled_at: '2026-10-20T09:00:00+02:00',
        tracking: 'off',
        attachments: [{ filename: 'invoice.pdf', url: 'https://files.acme.com/i.pdf' }],
        attachment_file: { filename: 'note.txt', extension: 'txt', data: Buffer.from('hi'), base64: Buffer.from('hi').toString('base64') },
        idempotency_key: 'order-1042',
      },
    });
    expect(seen[0].headers.get('idempotency-key')).toBe('order-1042');
    expect(seen[0].body).toEqual({
      from: 'hello@acme.com',
      to: ['a@b.co'],
      template: 'welcome',
      variables: { first_name: 'Ada' },
      meta: { order_id: '1042' },
      scheduled_at: '2026-10-20T07:00:00.000Z',
      tracking: false,
      attachments: [
        { filename: 'invoice.pdf', url: 'https://files.acme.com/i.pdf' },
        { filename: 'note.txt', content: 'aGk=', content_type: 'text/plain' },
      ],
    });
  });
  test('bad input fails before any request', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], scheduled_at: 'next tuesday-ish' } })).rejects.toThrow('not a valid date-time');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], idempotency_key: 'has space' } })).rejects.toThrow('Idempotency Key');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], subject: undefined } })).rejects.toThrow('Subject is required');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], content: '  ' } })).rejects.toThrow('email body');
    await expect(run({ action: sendEmailAction, props: { ...base, to: [] } })).rejects.toThrow('at least one');
    await expect(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'], attachments: [{ filename: 'a.pdf', url: 'file:///etc/passwd' }] } })).rejects.toThrow('http');
    expect(seen).toHaveLength(0);
  });
  test('a sandbox rejection explains what to do', async () => {
    stubFetch(replies([{ status: 403, body: { error: 'Workspace not verified', code: 'unverified_workspace_recipient' } }]));
    expect(String(await failure(run({ action: sendEmailAction, props: { ...base, to: ['a@b.co'] } })))).toContain('sandbox mode');
  });
});

describe('send_email_ai', () => {
  test('returns only the email body and sends html + text together', async () => {
    const seen = stubFetch(replies([{ body: SEND_REPLY }]));
    const result = await run({ action: sendEmailAiAction, props: { from_email: 'hello@acme.com', to: ['ada@example.com'], subject: 'Hi', html: '<b>x</b>', text: 'x', idempotency_key: 'k-1' } });
    expect(result).toEqual(SEND_REPLY);
    expect(seen[0].body).toMatchObject({ html: '<b>x</b>', text: 'x' });
    expect(seen[0].headers.get('idempotency-key')).toBe('k-1');
  });
});
