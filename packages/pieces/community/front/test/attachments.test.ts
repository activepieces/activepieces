import { ApFile } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendField,
  buildMultipartBody,
  toApFiles,
} from '../src/lib/common/attachments';
import { sendMessage } from '../src/lib/actions/send-message';
import { sendReply } from '../src/lib/actions/send-reply';

const PDF = Buffer.from('%PDF-1.4 a scanned bill of lading');
const auth = { secret_text: 'tok_test' } as never;
const file = (name = 'bol.pdf', data = PDF) => new ApFile(name, data, 'pdf');

/** The serialised request as Front would receive it. */
type Sent = { url: string; contentType: string; body: string; auth: string };

let sent: Sent[] = [];

beforeEach(() => {
  sent = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    // Building a real Request runs the same body serialisation fetch would, so
    // the assertions below read the actual wire bytes rather than a FormData
    // object that has not been encoded yet.
    const request = new Request('https://example.invalid/', init);
    sent.push({
      url: String(url),
      contentType: request.headers.get('content-type') ?? '',
      body: Buffer.from(await request.arrayBuffer()).toString('latin1'),
      auth: request.headers.get('authorization') ?? '',
    });
    return new Response(JSON.stringify({ id: 'msg_1' }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('multipart field naming', () => {
  it('names array entries by index, the way Front expects', () => {
    const form = new FormData();
    appendField(form, 'to', ['a@example.com', 'b@example.com']);
    expect(form.get('to[0]')).toBe('a@example.com');
    expect(form.get('to[1]')).toBe('b@example.com');
  });

  it('addresses a nested object with a second pair of brackets', () => {
    const form = new FormData();
    appendField(form, 'options', { tag_ids: ['tag_1', 'tag_2'] });
    expect(form.get('options[tag_ids][0]')).toBe('tag_1');
    expect(form.get('options[tag_ids][1]')).toBe('tag_2');
  });

  it('sends nothing for a value the caller left empty', () => {
    const form = new FormData();
    appendField(form, 'subject', '');
    appendField(form, 'cc', null);
    appendField(form, 'bcc', undefined);
    expect([...form.keys()]).toEqual([]);
  });

  it('keeps a false and a zero, which are values and not omissions', () => {
    const form = new FormData();
    appendField(form, 'should_add_default_signature', false);
    appendField(form, 'count', 0);
    expect(form.get('should_add_default_signature')).toBe('false');
    expect(form.get('count')).toBe('0');
  });

  it('carries the file bytes and its name', async () => {
    const form = buildMultipartBody({ body: 'hi' }, [{ file: file() }]);
    const part = form.get('attachments[0]') as File;
    expect(part).toBeInstanceOf(Blob);
    expect(part.name).toBe('bol.pdf');
    expect(Buffer.from(await part.arrayBuffer()).equals(PDF)).toBe(true);
  });
});

describe('files that did not resolve', () => {
  it('drops an entry whose url could not be fetched', () => {
    // Property.File returns null for a link it could not read - an expired
    // signed url, most often.
    expect(toApFiles([{ file: file() }, { file: null }, {}])).toHaveLength(1);
  });

  it('treats a missing attachments value as no attachments', () => {
    expect(toApFiles(undefined)).toEqual([]);
    expect(toApFiles(null)).toEqual([]);
  });
});

describe('sendMessage', () => {
  const base = {
    channel_id: 'cha_1',
    to: ['ops@example.com'],
    cc: [],
    bcc: [],
    subject: 'BOL for load 1027576',
    body: '<p>attached</p>',
    tag_ids: [],
  };

  it('sends multipart, with the bytes, when there is an attachment', async () => {
    await sendMessage.run({
      auth,
      propsValue: { ...base, attachments: [{ file: file() }] },
    } as never);

    expect(sent).toHaveLength(1);
    const [req] = sent;
    expect(req.url).toBe('https://api2.frontapp.com/channels/cha_1/messages');
    expect(req.auth).toBe('Bearer tok_test');
    // The boundary is the point: a hand-written multipart/form-data without one
    // is exactly the request Front cannot parse.
    expect(req.contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(req.body).toContain('name="to[0]"');
    expect(req.body).toContain('ops@example.com');
    expect(req.body).toContain('name="attachments[0]"; filename="bol.pdf"');
    expect(req.body).toContain(PDF.toString('latin1'));
  });

  it('still sends plain json when there is no attachment', async () => {
    await sendMessage.run({
      auth,
      propsValue: { ...base, attachments: [] },
    } as never);

    const [req] = sent;
    expect(req.contentType).toContain('application/json');
    expect(JSON.parse(req.body)).toMatchObject({
      channel_id: 'cha_1',
      to: ['ops@example.com'],
      subject: 'BOL for load 1027576',
    });
    expect(req.body).not.toContain('attachments');
  });

  it('sends json, not a broken multipart, when every file failed to resolve', async () => {
    await sendMessage.run({
      auth,
      propsValue: { ...base, attachments: [{ file: null }] },
    } as never);

    expect(sent[0].contentType).toContain('application/json');
  });

  it('attaches more than one file, each under its own index', async () => {
    await sendMessage.run({
      auth,
      propsValue: {
        ...base,
        attachments: [
          { file: file('bol.pdf') },
          { file: file('lumper.jpg', Buffer.from('JPEGDATA')) },
        ],
      },
    } as never);

    expect(sent[0].body).toContain('filename="bol.pdf"');
    expect(sent[0].body).toContain('filename="lumper.jpg"');
    expect(sent[0].body).toContain('JPEGDATA');
  });
});

describe('sendReply', () => {
  it('attaches to a reply on an existing conversation', async () => {
    await sendReply.run({
      auth,
      propsValue: {
        conversation_id: 'cnv_1',
        body: 'here it is',
        to: [],
        cc: [],
        bcc: [],
        attachments: [{ file: file() }],
      },
    } as never);

    expect(sent[0].url).toBe(
      'https://api2.frontapp.com/conversations/cnv_1/messages'
    );
    expect(sent[0].contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(sent[0].body).toContain('filename="bol.pdf"');
  });
});
