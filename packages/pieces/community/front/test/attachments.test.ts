import { Readable } from 'node:stream';
import { ApFile, PropertyType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraft } from '../src/lib/actions/create-draft';
import { createDraftReply } from '../src/lib/actions/create-draft-reply';
import { sendMessage } from '../src/lib/actions/send-message';
import { sendReply } from '../src/lib/actions/send-reply';
import { frontAttachments } from '../src/lib/common/attachments';

const PDF = Buffer.from('%PDF-1.4 a scanned bill of lading');
const JPEG = Buffer.from('JPEGDATA');

const auth = { secret_text: 'tok_test' };

function file(filename = 'bol.pdf', data = PDF): ApFile {
  return new ApFile(filename, data, filename.split('.').pop());
}

async function readBody(body: unknown): Promise<string> {
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('latin1');
  }
  return typeof body === 'string' ? body : String(body);
}

type Captured = {
  url: string;
  contentType: string;
  authorization: string;
  body: string;
};

let sent: Captured[] = [];

beforeEach(() => {
  sent = [];
  vi.stubGlobal('fetch', async (url: string, init: FetchInit) => {
    sent.push({
      url: String(url),
      contentType: init.headers['content-type'] ?? '',
      authorization: init.headers['authorization'] ?? '',
      body: await readBody(init.body),
    });
    return new Response(JSON.stringify({ id: 'msg_1' }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('attachments property contract', () => {
  it('is an array of files, which is what lets the engine resolve a url before the action runs', () => {
    const property = frontAttachments.property;
    expect(property.type).toBe(PropertyType.ARRAY);
    expect(property.properties?.['file'].type).toBe(PropertyType.FILE);
  });
});

describe('resolving the configured entries', () => {
  it('treats a missing value as no attachments', () => {
    expect(frontAttachments.resolve(undefined)).toEqual([]);
    expect(frontAttachments.resolve(null)).toEqual([]);
    expect(frontAttachments.resolve([])).toEqual([]);
  });

  it('keeps the configured order', () => {
    const files = frontAttachments.resolve([
      { file: file('a.pdf') },
      { file: file('b.pdf') },
    ]);
    expect(files.map((f) => f.filename)).toEqual(['a.pdf', 'b.pdf']);
  });

  it('fails loudly when a configured file could not be read', () => {
    expect(() => frontAttachments.resolve([{ file: null }])).toThrow(
      /Attachment 1 could not be read/
    );
    expect(() =>
      frontAttachments.resolve([{ file: file() }, {}])
    ).toThrow(/Attachment 2 could not be read/);
  });
});

describe('multipart encoding', () => {
  it('names array entries by index, the way Front expects', () => {
    const form = frontAttachments.buildBody({
      fields: { to: ['a@example.com', 'b@example.com'] },
      files: [],
    });
    const body = form.getBuffer().toString('latin1');
    expect(body).toContain('name="to[0]"');
    expect(body).toContain('name="to[1]"');
  });

  it('addresses a nested object with a second pair of brackets', () => {
    const form = frontAttachments.buildBody({
      fields: { options: { tag_ids: ['tag_1'] } },
      files: [],
    });
    expect(form.getBuffer().toString('latin1')).toContain(
      'name="options[tag_ids][0]"'
    );
  });

  it('omits an empty value but keeps a false and a zero', () => {
    const form = frontAttachments.buildBody({
      fields: {
        subject: null,
        cc: undefined,
        text: '',
        should_add_default_signature: false,
        count: 0,
      },
      files: [],
    });
    const body = form.getBuffer().toString('latin1');
    expect(body).not.toContain('name="subject"');
    expect(body).not.toContain('name="cc"');
    expect(body).not.toContain('name="text"');
    expect(body).toContain('name="should_add_default_signature"');
    expect(body).toContain('false');
    expect(body).toContain('name="count"');
  });

  it('carries the file bytes, its name and a content type derived from it', () => {
    const form = frontAttachments.buildBody({
      fields: {},
      files: [file()],
    });
    const body = form.getBuffer().toString('latin1');
    expect(body).toContain('name="attachments[0]"; filename="bol.pdf"');
    expect(body).toContain('Content-Type: application/pdf');
    expect(body).toContain(PDF.toString('latin1'));
  });
});

describe('sendMessage', () => {
  const base = {
    channel_id: 'cha_1',
    to: ['ops@example.com'],
    subject: 'BOL for load 1027576',
    body: '<p>attached</p>',
  };

  it('sends multipart, with the bytes, when there is an attachment', async () => {
    await sendMessage.run(actionContext({ ...base, attachments: [{ file: file() }] }));

    expect(sent).toHaveLength(1);
    const [request] = sent;
    expect(request.url).toBe('https://api2.frontapp.com/channels/cha_1/messages');
    expect(request.authorization).toBe('Bearer tok_test');
    expect(request.contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(request.body).toContain('name="to[0]"');
    expect(request.body).toContain('ops@example.com');
    expect(request.body).toContain('name="attachments[0]"; filename="bol.pdf"');
    expect(request.body).toContain(PDF.toString('latin1'));
  });

  it('attaches more than one file, each under its own index', async () => {
    await sendMessage.run(
      actionContext({
        ...base,
        attachments: [{ file: file() }, { file: file('lumper.jpg', JPEG) }],
      })
    );

    expect(sent[0].body).toContain('name="attachments[0]"; filename="bol.pdf"');
    expect(sent[0].body).toContain('name="attachments[1]"; filename="lumper.jpg"');
    expect(sent[0].body).toContain(JPEG.toString('latin1'));
  });

  it('still sends plain json when there is no attachment', async () => {
    await sendMessage.run(actionContext({ ...base, attachments: [] }));

    const [request] = sent;
    expect(request.contentType).toContain('application/json');
    expect(JSON.parse(request.body)).toMatchObject({
      channel_id: 'cha_1',
      to: ['ops@example.com'],
      subject: 'BOL for load 1027576',
    });
    expect(request.body).not.toContain('attachments');
  });

  it('sends nothing at all when a configured attachment could not be read', async () => {
    await expect(
      sendMessage.run(actionContext({ ...base, attachments: [{ file: null }] }))
    ).rejects.toThrow(/could not be read/);
    expect(sent).toHaveLength(0);
  });
});

describe('sendReply', () => {
  it('attaches to a reply on an existing conversation', async () => {
    await sendReply.run(
      actionContext({
        conversation_id: 'cnv_1',
        body: 'here it is',
        attachments: [{ file: file() }],
      })
    );

    expect(sent[0].url).toBe(
      'https://api2.frontapp.com/conversations/cnv_1/messages'
    );
    expect(sent[0].contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(sent[0].body).toContain('name="attachments[0]"; filename="bol.pdf"');
  });

  it('still sends plain json when there is no attachment', async () => {
    await sendReply.run(
      actionContext({ conversation_id: 'cnv_1', body: 'no files', attachments: [] })
    );
    expect(sent[0].contentType).toContain('application/json');
  });
});

describe('createDraft', () => {
  it('attaches to a new draft', async () => {
    await createDraft.run(
      actionContext({
        channel_id: 'cha_1',
        to: ['ops@example.com'],
        body: 'draft body',
        mode: 'shared',
        attachments: [{ file: file() }],
      })
    );

    expect(sent[0].url).toBe('https://api2.frontapp.com/channels/cha_1/drafts');
    expect(sent[0].contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(sent[0].body).toContain('name="attachments[0]"; filename="bol.pdf"');
    expect(sent[0].body).toContain('name="mode"');
  });

  it('still sends plain json when there is no attachment', async () => {
    await createDraft.run(
      actionContext({
        channel_id: 'cha_1',
        to: ['ops@example.com'],
        body: 'draft body',
        mode: 'shared',
        attachments: [],
      })
    );
    expect(sent[0].contentType).toContain('application/json');
  });
});

describe('createDraftReply', () => {
  it('attaches to a draft reply on an existing conversation', async () => {
    await createDraftReply.run(
      actionContext({
        conversation_id: 'cnv_1',
        body: 'draft reply',
        mode: 'private',
        attachments: [{ file: file() }],
      })
    );

    expect(sent[0].url).toBe(
      'https://api2.frontapp.com/conversations/cnv_1/drafts'
    );
    expect(sent[0].contentType).toMatch(/^multipart\/form-data; boundary=.+/);
    expect(sent[0].body).toContain('name="attachments[0]"; filename="bol.pdf"');
  });

  it('still sends plain json when there is no attachment', async () => {
    await createDraftReply.run(
      actionContext({
        conversation_id: 'cnv_1',
        body: 'draft reply',
        mode: 'private',
        attachments: [],
      })
    );
    expect(sent[0].contentType).toContain('application/json');
  });
});

function actionContext(propsValue: Record<string, unknown>) {
  return { auth, propsValue } as unknown as Parameters<typeof sendMessage.run>[0];
}

type FetchInit = {
  headers: Record<string, string>;
  body: unknown;
};
