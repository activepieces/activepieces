import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSignatureRequestAction } from '../src/lib/actions/create-signature-request';
import { createSignatureRequestAiAction } from '../src/lib/actions/create-signature-request-ai';
import { getSignatureStatusAction } from '../src/lib/actions/get-signature-status';
import { getSignerInfoAction } from '../src/lib/actions/get-signer-info';
import { listSignatureRequestsAction } from '../src/lib/actions/list-signature-requests';
import { sendSignerReminderAction } from '../src/lib/actions/send-signer-reminder';
import { voidSignatureAction } from '../src/lib/actions/void-signature';
import { increaseExpirationDaysAction } from '../src/lib/actions/increase-expiration-days';
import { downloadSignedFilesAction } from '../src/lib/actions/download-signed-files';
import { downloadAuditTrailAction } from '../src/lib/actions/download-audit-trail';
import { Readable } from 'stream';
import { SERVER, defaultRoutes, fakeContext, mockHttp, pdf, record, run } from './helpers';

afterEach(() => vi.restoreAllMocks());

const created = { uuid: 'u1', token_requester: 'TR1', status: 'sent', signers: [] };
const sigRoutes = defaultRoutes([
  { method: 'POST', match: (u) => u === `https://${SERVER}/v1/signature`, body: created },
  { method: 'GET', match: (u) => u.includes('/v1/signature/requesterview/'), body: { token_requester: 'TR1', status: 'completed', server: SERVER } },
  { method: 'GET', match: (u) => u.includes('/v1/signature/receiver/info/'), body: { uuid: 's1', email: 'a@b.co', access_code: 'secret' } },
  { method: 'GET', match: (u) => u.startsWith('https://api.ilovepdf.com/v1/signature/list'), body: [{ token_requester: 'A' }, { token_requester: 'B' }] },
  { method: 'POST', match: (u) => /\/v1\/signature\/(sendReminder|void|increase-expiration-days)\//.test(u), body: {} },
  { method: 'GET', match: (u) => u.includes('/download-'), reply: () => ({ body: Readable.from([Buffer.from('ZIP')]), headers: { 'content-type': 'application/zip' } }) },
]);

const signers = [
  { name: 'Ann', email: 'ann@example.com', access_code: '1234' },
  { name: 'Bob', email: 'bob@example.com', type: 'viewer' },
];

describe('create signature request', () => {
  it('is human-only and builds the exact body', async () => {
    const calls = mockHttp(sigRoutes);
    const out = await run(createSignatureRequestAction)(fakeContext({
        files: [{ file: pdf }],
        signers,
        elements: [{ signer_email: 'ANN@example.com', type: 'signature', position: 'bottom right', pages: '1' }],
        expiration_days: 30,
      }).context
    );
    expect(createSignatureRequestAction.audience).toBe('human');
    const body = record(calls.find((c) => c.url.endsWith('/v1/signature'))?.body);
    expect(body).toMatchObject({ task: 'TASK1', expiration_days: 30, files: [{ server_filename: 'sf-1', filename: 'in.pdf' }] });
    expect(body['signers']).toEqual([
      {
        name: 'Ann',
        email: 'ann@example.com',
        type: 'signer',
        force_signature_type: 'all',
        access_code: '1234',
        files: [{ server_filename: 'sf-1', elements: [{ type: 'signature', position: 'bottom right', pages: '1' }] }],
      },
      { name: 'Bob', email: 'bob@example.com', type: 'viewer', force_signature_type: 'all', files: [{ server_filename: 'sf-1' }] },
    ]);
    expect(calls.find((c) => c.url.endsWith('/v1/signature'))?.redact).toBe(true);
    expect(out).toMatchObject({ token_requester: 'TR1', server: SERVER });
  });

  it.each([
    [{ elements: [{ signer_email: 'nobody@x.co', type: 'signature', position: 'a', pages: '1' }] }, /matches no signer/],
    [{ elements: [{ signer_email: 'ann@example.com', type: 'signature', pages: '1' }] }, /element 1 needs/],
    [{ expiration_days: 200 }, /between 1 and 130/],
    [{ signers: [{ name: 'A', email: 'bad' }] }, /invalid email/],
    [{ signers: [signers[0], signers[0]] }, /more than once/],
    [{ files: [] }, /At least one PDF/],
  ])('rejects %o before any request', async (override, message) => {
    const calls = mockHttp(sigRoutes);
    await expect(run(createSignatureRequestAction)(fakeContext({ files: [{ file: pdf }], signers, ...override }).context)).rejects.toThrow(message);
    expect(calls.filter((c) => c.url.includes('/v1/start/'))).toHaveLength(0);
  });

  it('ai twin uploads URLs and refuses http', async () => {
    const calls = mockHttp(sigRoutes);
    await run(createSignatureRequestAiAction)(fakeContext({ file_urls: ['https://x.co/a.pdf'], signers: [signers[0]] }).context);
    expect(createSignatureRequestAiAction.audience).toBe('ai');
    expect(calls.find((c) => c.url.endsWith('/v1/upload'))?.body).toEqual({ task: 'TASK1', cloud_file: 'https://x.co/a.pdf' });
    await expect(run(createSignatureRequestAiAction)(fakeContext({ file_urls: ['http://x.co/a.pdf'], signers }).context)).rejects.toThrow(/https/);
  });
});

describe('signature follow-ups', () => {
  it('status, signer info and list', async () => {
    const calls = mockHttp(sigRoutes);
    expect(await run(getSignatureStatusAction)(fakeContext({ token_requester: ' TR1 ' }).context)).toMatchObject({ status: 'completed' });
    expect(calls.at(-1)?.url).toBe('https://api.ilovepdf.com/v1/signature/requesterview/TR1');
    expect(await run(getSignerInfoAction)(fakeContext({ token_signer: 'S/1' }).context)).toMatchObject({ access_code: true });
    expect(calls.at(-1)?.url).toBe('https://api.ilovepdf.com/v1/signature/receiver/info/S%2F1');
    const list = await run(listSignatureRequestsAction)(fakeContext({ page: 1, per_page: 2 }).context);
    expect(list).toMatchObject({ count: 2, has_more: true, next_page: 2 });
    expect(calls.at(-1)?.query).toEqual({ page: '1', 'per-page': '2' });
    await expect(run(listSignatureRequestsAction)(fakeContext({ per_page: 101 }).context)).rejects.toThrow(/between 1 and 100/);
  });

  it('reminder, void, increase expiration', async () => {
    const calls = mockHttp(sigRoutes);
    expect(await run(sendSignerReminderAction)(fakeContext({ token_requester: 'TR1' }).context)).toMatchObject({ success: true, token_requester: 'TR1' });
    expect(calls.at(-1)?.url).toBe('https://api.ilovepdf.com/v1/signature/sendReminder/TR1');
    await run(voidSignatureAction)(fakeContext({ token_requester: 'TR1' }).context);
    expect(calls.at(-1)?.url).toBe('https://api.ilovepdf.com/v1/signature/void/TR1');
    expect(await run(increaseExpirationDaysAction)(fakeContext({ token_requester: 'TR1', days: 5 }).context)).toMatchObject({ days: 5 });
    expect(calls.at(-1)?.body).toEqual({ days: 5 });
    await expect(run(increaseExpirationDaysAction)(fakeContext({ token_requester: 'TR1', days: 131 }).context)).rejects.toThrow(/between 1 and 130/);
    await expect(run(voidSignatureAction)(fakeContext({ token_requester: '..' }).context)).rejects.toThrow(/required/);
  });

  it('downloads go to the server host as a stream', async () => {
    const calls = mockHttp(sigRoutes);
    const out = await run(downloadSignedFilesAction)(fakeContext({ token_requester: 'TR1' }).context);
    const dl = calls.find((c) => c.url.includes('download-signed'));
    expect(dl?.url).toBe(`https://${SERVER}/v1/signature/TR1/download-signed`);
    expect(dl?.responseType).toBe('stream');
    expect(out).toMatchObject({ file_name: 'signed-TR1.zip', size: 3, content_type: 'application/zip' });
    await run(downloadAuditTrailAction)(fakeContext({ token_requester: 'TR1', server: 'api3.ilovepdf.com' }).context);
    expect(calls.at(-1)?.url).toBe('https://api3.ilovepdf.com/v1/signature/TR1/download-audit');
    await expect(run(downloadAuditTrailAction)(fakeContext({ token_requester: 'TR1', server: 'evil.io' }).context)).rejects.toThrow(/unexpected server/);
  });
});
