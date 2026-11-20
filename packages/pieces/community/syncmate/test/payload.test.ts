import { describe, expect, it } from 'vitest';
import {
  assertSendable,
  bulkBody,
  channelJid,
  cleanPhone,
  fileNameFromUrl,
  groupJid,
  mediaFromArray,
  metaMediaBody,
  metaTemplateBody,
  metaTextBody,
  rawBase64,
  RecipientType,
  singleBody,
  standardMessage,
} from '../src/lib/common/payload';
import { assertWithinGatewayLimit, credentials, describeError, normalizeBaseUrl } from '../src/lib/common/client';
import { signEvent, verifyEvent } from '../src/lib/common/signature';

describe('recipients', () => {
  it('cleans phone numbers', () => {
    expect(cleanPhone(' +91 98765-43210 ')).toBe('+919876543210');
    expect(cleanPhone('(+1) 415.555.0100')).toBe('+14155550100');
    expect(cleanPhone(undefined)).toBe('');
  });

  it('adds group and channel suffixes once', () => {
    expect(groupJid('120363012345')).toBe('120363012345@g.us');
    expect(groupJid('120363012345@g.us')).toBe('120363012345@g.us');
    expect(groupJid('  ')).toBe('');
    expect(channelJid('120363099')).toBe('120363099@newsletter');
    expect(channelJid('120363099@newsletter')).toBe('120363099@newsletter');
  });
});

describe('standard sends', () => {
  it('builds a single-entry body for one recipient', () => {
    const msg = standardMessage({ number: '+919876543210', message: 'Hi', type: RecipientType.CONTACT });
    expect(singleBody(msg)).toEqual({ msgs: [{ number: '+919876543210', message: 'Hi', type: 1 }] });
  });

  it('includes media only when there is some', () => {
    const media = [{ media_base64: 'AAAA', file_name: 'a.png' }];
    expect(standardMessage({ number: 'x', message: '', type: RecipientType.GROUP, media }).media).toEqual(media);
    expect(standardMessage({ number: 'x', message: 'm', type: RecipientType.GROUP, media: [] })).not.toHaveProperty('media');
  });

  it('refuses an empty recipient or an empty message without media', () => {
    expect(() => assertSendable(standardMessage({ number: '', message: 'Hi', type: 1 }), 'phone')).toThrow('Enter the phone');
    expect(() => assertSendable(standardMessage({ number: '1', message: '  ', type: 1 }), 'phone')).toThrow('message or add an attachment');
    expect(() =>
      assertSendable(standardMessage({ number: '1', message: '', type: 1, media: [{ media_base64: 'A', file_name: 'a' }] }), 'phone')
    ).not.toThrow();
  });

  it('builds a bulk body: split, cleaned, de-duplicated, with time gap', () => {
    const body = bulkBody({ numbers: ['+91 1111', '+912222, +911111', '', '+913333\n+914444'], message: 'Sale!', timeGap: 5 });
    expect(body.msgs.map((m) => m.number)).toEqual(['+911111', '+912222', '+913333', '+914444']);
    expect(body.msgs.every((m) => m.type === 1 && m.message === 'Sale!')).toBe(true);
    expect(body.time_gap).toBe(5);
  });

  it('omits time_gap when not given and refuses a gap under 5 minutes', () => {
    expect(bulkBody({ numbers: ['1'], message: 'x' })).not.toHaveProperty('time_gap');
    expect(() => bulkBody({ numbers: ['1'], message: 'x', timeGap: 2 })).toThrow('5 or more');
    expect(() => bulkBody({ numbers: ['1'], message: 'x', timeGap: 5.5 })).toThrow('whole number');
    expect(() => bulkBody({ numbers: [' ', ''], message: 'x' })).toThrow('at least one phone number');
  });

  it('normalises base64 attachments and skips incomplete rows', () => {
    expect(rawBase64('data:image/png;base64,AA BB\nCC')).toBe('AABBCC');
    expect(
      mediaFromArray([
        { media_base64: 'QUJD', file_name: 'a.txt' },
        { media_base64: '', file_name: 'b.txt' },
        { media_base64: 'QUJD' },
        null,
      ])
    ).toEqual([{ media_base64: 'QUJD', file_name: 'a.txt' }]);
    expect(mediaFromArray('nope')).toEqual([]);
  });

  it('names a downloaded file from its URL', () => {
    expect(fileNameFromUrl('https://cdn.example.com/files/Invoice%2042.pdf?x=1')).toBe('Invoice 42.pdf');
    expect(fileNameFromUrl('https://cdn.example.com/')).toBe('file');
    expect(fileNameFromUrl('not a url')).toBe('file');
  });
});

describe('meta sends', () => {
  it('builds a text body', () => {
    expect(metaTextBody(' +91 98765 43210', 'Hello')).toEqual({ to: '+919876543210', type: 'text', body: 'Hello' });
    expect(() => metaTextBody('', 'x')).toThrow('recipient');
    expect(() => metaTextBody('1', ' ')).toThrow('message text');
  });

  it('builds a media body with caption rules', () => {
    expect(metaMediaBody({ to: '1', mediaType: 'image', mediaUrl: 'https://x.test/a.jpg', caption: 'Cap' })).toEqual({
      to: '1',
      media_type: 'image',
      media_url: 'https://x.test/a.jpg',
      caption: 'Cap',
    });
    expect(metaMediaBody({ to: '1', mediaType: 'document', mediaUrl: 'https://x.test/d.pdf', fileName: 'inv.pdf' })).toEqual({
      to: '1',
      media_type: 'document',
      media_url: 'https://x.test/d.pdf',
      caption: '',
      media_filename: 'inv.pdf',
    });
    expect(metaMediaBody({ to: '1', mediaType: 'audio', mediaUrl: 'https://x.test/a.mp3', caption: 'ignored' })).toEqual({
      to: '1',
      media_type: 'audio',
      media_url: 'https://x.test/a.mp3',
    });
    expect(() => metaMediaBody({ to: '1', mediaType: 'image', mediaUrl: 'ftp://x' })).toThrow('http(s)');
    expect(() => metaMediaBody({ to: '1', mediaType: 'image' })).toThrow('Add a file or enter a Media URL');
  });

  it('sends a media file as base64 instead of a URL', () => {
    expect(
      metaMediaBody({
        to: '1',
        mediaType: 'document',
        mediaUrl: 'https://x.test/ignored.pdf',
        file: { base64: 'JVBE\nRi0=', fileName: 'invoice.pdf' },
        caption: 'Your invoice',
      })
    ).toEqual({ to: '1', media_type: 'document', media_base64: 'JVBERi0=', media_filename: 'invoice.pdf', caption: 'Your invoice' });
    expect(
      metaMediaBody({ to: '1', mediaType: 'image', file: { base64: 'iVBO', fileName: 'p.png' }, fileName: 'Renamed.png' })
    ).toMatchObject({ media_base64: 'iVBO', media_filename: 'Renamed.png' });
  });

  it('builds a template body with numbered params and a header', () => {
    expect(
      metaTemplateBody({
        to: '+91 1',
        templateName: ' order_update ',
        language: 'en_US',
        variables: { '2': 'Shipped', '1': 'Asha', var3: '#1001', '4': '', junk: 'x' },
        headerMediaType: 'image',
        headerMediaUrl: 'https://x.test/h.png',
      })
    ).toEqual({
      to: '+911',
      type: 'template',
      template_name: 'order_update',
      language: 'en_US',
      template_params: { '1': 'Asha', '2': 'Shipped', '3': '#1001' },
      header_media_url: 'https://x.test/h.png',
      header_media_type: 'image',
    });
    expect(
      metaTemplateBody({
        to: '1',
        templateName: 't',
        language: 'en',
        headerMediaType: 'document',
        headerMediaUrl: 'https://x.test/ignored.pdf',
        headerFile: { base64: 'data:application/pdf;base64,JVBERi0=', fileName: 'terms.pdf' },
      })
    ).toEqual({
      to: '1',
      type: 'template',
      template_name: 't',
      language: 'en',
      header_media_base64: 'JVBERi0=',
      header_media_filename: 'terms.pdf',
      header_media_type: 'document',
    });
    expect(() => metaTemplateBody({ to: '1', templateName: 't', language: 'en', headerMediaUrl: 'ftp://x' })).toThrow('Header Media URL');
    expect(metaTemplateBody({ to: '1', templateName: 't', language: 'en' })).toEqual({
      to: '1',
      type: 'template',
      template_name: 't',
      language: 'en',
    });
    expect(() => metaTemplateBody({ to: '1', templateName: '', language: 'en' })).toThrow('Choose a template');
    expect(() => metaTemplateBody({ to: '1', templateName: 't', language: '' })).toThrow('language');
  });
});

describe('client', () => {
  it('defaults the gateway URL and trims slashes', () => {
    expect(normalizeBaseUrl('')).toBe('https://api.assistro.co');
    expect(normalizeBaseUrl(undefined)).toBe('https://api.assistro.co');
    expect(normalizeBaseUrl(' https://api.staging.assistro.co/// ')).toBe('https://api.staging.assistro.co');
  });

  it('reads credentials from an action context and from validate', () => {
    expect(credentials({ type: 'CUSTOM_AUTH', props: { apiKey: ' k ', baseUrl: '' } })).toEqual({
      apiKey: 'k',
      baseUrl: 'https://api.assistro.co',
    });
    expect(credentials({ apiKey: 'k', baseUrl: 'http://127.0.0.1:9' })).toEqual({ apiKey: 'k', baseUrl: 'http://127.0.0.1:9' });
    expect(() => credentials({ props: {} })).toThrow('no API key');
  });

  it('refuses a body over the 5 MB gateway limit before sending', () => {
    expect(() => assertWithinGatewayLimit({ msgs: [{ media: 'x'.repeat(5 * 1024 * 1024) }] })).toThrow('over the 5 MB');
    expect(() => assertWithinGatewayLimit({ msgs: [] })).not.toThrow();
  });

  it('turns gateway refusals into actionable messages', () => {
    const http = (status: number, body: unknown) => ({ response: { status, body } });
    expect(describeError(http(401, { reason: 'token_expired' }))).toContain('expired');
    expect(describeError(http(401, { reason: 'invalid_token' }))).toContain('invalid or was revoked');
    expect(describeError(http(403, { message: 'Integration is not active' }))).toContain('Integration is not active');
    expect(describeError(http(422, { errors: { 'msgs.0.number': ['The number field is required for each message.'] } }))).toContain(
      'number field is required'
    );
    expect(describeError(http(429, { message: 'Monthly limit reached', resets_at: '2026-12-01T00:00:00Z' }))).toBe(
      'Monthly limit reached. Resets at 2026-12-01T00:00:00Z.'
    );
    expect(describeError(http(404, '{"message":"Job not found"}'))).toBe('Not found: Job not found.');
    expect(describeError(http(413, null))).toContain('5 MB');
    expect(describeError(http(429, { success: false, status: 0, message: 'Rate limit exceeded, try again in a minute' }))).toBe(
      'Rate limit exceeded, try again in a minute. Turn on "Retry on Failure" for this step to retry automatically.'
    );
    expect(describeError(http(502, { message: 'Bad gateway' }))).toBe('SyncMate request failed (HTTP 502): Bad gateway.');
    expect(describeError(http(400, { error: 'Webhook data is invalid or missing.' }))).toBe(
      'SyncMate request failed (HTTP 400): Webhook data is invalid or missing.'
    );
    expect(describeError(new Error('socket hang up'))).toBe('socket hang up');
  });
});

describe('event signatures', () => {
  const body = '{"event":"message.received","message":{"text":"Hi/там"}}';

  it('accepts a fresh, correct signature', () => {
    const ts = 1_800_000_000;
    expect(verifyEvent({ secret: 's', rawBody: body, timestamp: String(ts), signature: signEvent('s', body, ts), nowSeconds: ts + 10 })).toBe(true);
  });

  it('rejects a wrong secret, a changed body, a stale timestamp or a missing header', () => {
    const ts = 1_800_000_000;
    const sig = signEvent('s', body, ts);
    expect(verifyEvent({ secret: 'other', rawBody: body, timestamp: ts, signature: sig, nowSeconds: ts })).toBe(false);
    expect(verifyEvent({ secret: 's', rawBody: body + ' ', timestamp: ts, signature: sig, nowSeconds: ts })).toBe(false);
    expect(verifyEvent({ secret: 's', rawBody: body, timestamp: ts, signature: sig, nowSeconds: ts + 301 })).toBe(false);
    expect(verifyEvent({ secret: 's', rawBody: body, timestamp: undefined, signature: sig, nowSeconds: ts })).toBe(false);
    expect(verifyEvent({ secret: 's', rawBody: body, timestamp: ts, signature: undefined, nowSeconds: ts })).toBe(false);
  });

  it('matches Assistro\'s PHP signer and its JSON encoding byte for byte', () => {
    // Reference values printed by PHP 8.1: json_encode(..., JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    // and EventSigner::sign('secret', $body, 1800000000).
    const phpBody = '{"event":"message.received","message":{"text":"Hi/там","media_url":"https://x.test/a.png"}}';
    const phpSignature = 'sha256=dcee2bfa04347c62bea203470866da58ce48baba3b2fe7a0f38a3f5936210010';

    expect(signEvent('secret', phpBody, 1800000000)).toBe(phpSignature);
    // When Activepieces gives no raw body, the trigger re-encodes the parsed one: it must match PHP's.
    expect(JSON.stringify(JSON.parse(phpBody))).toBe(phpBody);
  });
});
