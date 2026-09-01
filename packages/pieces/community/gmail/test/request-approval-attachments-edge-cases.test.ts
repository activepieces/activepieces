/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { simpleParser } from 'mailparser';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'sent-message-id' } });
const listMock = vi.fn().mockResolvedValue({ data: { messages: [] } });

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: { messages: { send: sendMock, list: listMock } },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
  getAccessToken: vi.fn().mockResolvedValue('an-access-token'),
  getUserEmail: vi.fn().mockResolvedValue('sender@example.com'),
}));

import { requestApprovalInEmail } from '../src/lib/actions/request-approval-in-email';

const RESUME_URL = 'https://ap.test/resume';
const BYTES = Buffer.from('%PDF-1.4 edge case attachment');

type ApprovalContext = Parameters<typeof requestApprovalInEmail.run>[0];

function buildContext(
  propsValue: Record<string, unknown>,
  overrides: Record<string, unknown> = {}
): ApprovalContext {
  const context = createMockActionContext({
    propsValue: {
      receiver: 'approver@example.com',
      subject: 'Please approve',
      body: 'Sign off on the attached document.',
      ...propsValue,
    },
  });

  return {
    ...context,
    run: {
      ...context.run,
      createWaitpoint: async () => ({ id: 'waitpoint-1', resumeUrl: RESUME_URL }),
      waitForWaitpoint: () => undefined,
    },
    ...overrides,
  } as unknown as ApprovalContext;
}

const attachment = (
  filename: string,
  extension: string | undefined,
  name?: string
) => ({
  file: { filename, extension, base64: BYTES.toString('base64') },
  name,
});

async function sentMail() {
  expect(sendMock).toHaveBeenCalledTimes(1);
  const raw = sendMock.mock.calls[0][0].requestBody.raw as string;
  return await simpleParser(
    Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  );
}

function sentMime() {
  const raw = sendMock.mock.calls[0][0].requestBody.raw as string;
  return Buffer.from(
    raw.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('utf8');
}

describe('request approval in email — attachment edge cases', () => {
  beforeEach(() => {
    sendMock.mockClear();
    listMock.mockClear();
  });

  test('an empty attachment name still leaves the file named', async () => {
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('rate-con.pdf', 'pdf', '')] })
    );

    const mail = await sentMail();
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments[0].filename).toMatch(/\.pdf$/);
  });

  test('a file with no extension is sent as an opaque binary', async () => {
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('scan', undefined)] })
    );

    const mail = await sentMail();
    expect(mail.attachments[0].contentType).toBe('application/octet-stream');
    expect(mail.attachments[0].content.equals(BYTES)).toBe(true);
  });

  test('an unrecognised extension is sent as an opaque binary', async () => {
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('thing.qqq', 'qqq')] })
    );

    const mail = await sentMail();
    expect(mail.attachments[0].contentType).toBe('application/octet-stream');
  });

  test('a non-ASCII attachment name survives the encoding round trip', async () => {
    const name = 'تأكيد-السعر — 10042.pdf';
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('tmp.pdf', 'pdf', name)] })
    );

    const mail = await sentMail();
    expect(mail.attachments[0].filename).toBe(name);
  });

  test('a newline in an attachment name cannot inject a mail header', async () => {
    await requestApprovalInEmail.run(
      buildContext({
        attachments: [
          attachment(
            'ok.pdf',
            'pdf',
            'invoice.pdf\r\nBcc: attacker@evil.test\r\nX-Injected: yes'
          ),
        ],
      })
    );

    const mail = await sentMail();
    expect(mail.bcc).toBeUndefined();
    expect(sentMime()).not.toMatch(/^Bcc:/im);
    expect(sentMime()).not.toMatch(/^X-Injected:/im);
  });

  test('ten attachments all travel, in the order they were given', async () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      attachment(`doc-${i}.pdf`, 'pdf')
    );

    await requestApprovalInEmail.run(buildContext({ attachments: many }));

    const mail = await sentMail();
    expect(mail.attachments).toHaveLength(10);
    expect(mail.attachments.map((a) => a.filename)).toEqual(
      many.map((m) => m.file.filename)
    );
  });

  test('an attachment does not disturb the threading headers', async () => {
    listMock.mockResolvedValueOnce({
      data: { messages: [{ id: 'm-1', threadId: 'thread-1' }] },
    });

    await requestApprovalInEmail.run(
      buildContext({
        in_reply_to: '<original-message@example.com>',
        attachments: [attachment('rate-con.pdf', 'pdf')],
      })
    );

    const mime = sentMime();
    expect(mime).toMatch(/In-Reply-To: <original-message@example\.com>/i);
    expect(mime).toMatch(/References: <original-message@example\.com>/i);
    expect((await sentMail()).attachments).toHaveLength(1);
  });

  test('resuming after the approver answers does not send a second email', async () => {
    await requestApprovalInEmail.run(
      buildContext(
        { attachments: [attachment('rate-con.pdf', 'pdf')] },
        {
          executionType: 'RESUME',
          resumePayload: { queryParams: { action: 'approve' } },
        }
      )
    );

    expect(sendMock).not.toHaveBeenCalled();
  });

  test('a file that did not resolve fails before any mail is sent', async () => {
    await expect(
      requestApprovalInEmail.run(
        buildContext({ attachments: [{ file: null, name: undefined }] })
      )
    ).rejects.toThrow();

    expect(sendMock).not.toHaveBeenCalled();
  });
});
