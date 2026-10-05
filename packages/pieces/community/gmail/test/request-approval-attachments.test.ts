/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { simpleParser } from 'mailparser';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'sent-message-id' } });
const listMock = vi.fn().mockResolvedValue({ data: { messages: [] } });

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      messages: {
        send: sendMock,
        list: listMock,
      },
    },
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
const PDF_BYTES = Buffer.from('%PDF-1.4 approval attachment');
const PNG_BYTES = Buffer.from('not really a png');

type ApprovalContext = Parameters<typeof requestApprovalInEmail.run>[0];

/**
 * The approval action pauses on a waitpoint, which the shared mock context has
 * no opinion about, so those two calls are the only additions to it.
 */
function buildContext(propsValue: Record<string, unknown>): ApprovalContext {
  const context = createMockActionContext({
    propsValue: {
      receiver: 'approver@example.com',
      subject: 'Please approve',
      body: 'Sign off on the attached rate confirmation.',
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
  } as unknown as ApprovalContext;
}

function attachment(
  filename: string,
  extension: string,
  bytes: Buffer,
  name?: string
) {
  return { file: { filename, extension, base64: bytes.toString('base64') }, name };
}

/**
 * Gmail is handed the whole message as one base64url `raw` field, so read the
 * message back out of the call and parse it as the email it actually is.
 */
async function sentMail() {
  expect(sendMock).toHaveBeenCalledTimes(1);
  const raw = sendMock.mock.calls[0][0].requestBody.raw as string;
  const mime = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return await simpleParser(mime);
}

describe('request approval in email', () => {
  beforeEach(() => {
    sendMock.mockClear();
    listMock.mockClear();
  });

  test('an attached file arrives with its bytes intact', async () => {
    await requestApprovalInEmail.run(
      buildContext({
        attachments: [attachment('rate-confirmation.pdf', 'pdf', PDF_BYTES)],
      })
    );

    const mail = await sentMail();
    expect(mail.attachments).toHaveLength(1);
    expect(mail.attachments[0].filename).toBe('rate-confirmation.pdf');
    expect(mail.attachments[0].contentType).toBe('application/pdf');
    expect(mail.attachments[0].content.equals(PDF_BYTES)).toBe(true);
  });

  test('the attachment name overrides the name of the file itself', async () => {
    await requestApprovalInEmail.run(
      buildContext({
        attachments: [
          attachment('tmp-8f21.pdf', 'pdf', PDF_BYTES, 'Load 10042 rate con.pdf'),
        ],
      })
    );

    const mail = await sentMail();
    expect(mail.attachments[0].filename).toBe('Load 10042 rate con.pdf');
  });

  test('the content type comes from the file extension', async () => {
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('pod.png', 'png', PNG_BYTES)] })
    );

    const mail = await sentMail();
    expect(mail.attachments[0].contentType).toBe('image/png');
  });

  test('several attachments all travel', async () => {
    await requestApprovalInEmail.run(
      buildContext({
        attachments: [
          attachment('bol.pdf', 'pdf', PDF_BYTES),
          attachment('pod.png', 'png', PNG_BYTES),
        ],
      })
    );

    const mail = await sentMail();
    expect(mail.attachments.map((a) => a.filename)).toEqual(['bol.pdf', 'pod.png']);
  });

  test('the approval link still reaches the recipient alongside an attachment', async () => {
    await requestApprovalInEmail.run(
      buildContext({ attachments: [attachment('bol.pdf', 'pdf', PDF_BYTES)] })
    );

    const mail = await sentMail();
    expect(mail.html).toContain(`${RESUME_URL}/confirm`);
    expect(mail.html).toContain('Review &amp; Respond');
    expect(mail.subject).toBe('Please approve');
    expect(mail.to?.text).toBe('approver@example.com');
  });

  test('a flow that never used the field sends the same message as before', async () => {
    await requestApprovalInEmail.run(buildContext({}));

    const mail = await sentMail();
    expect(mail.attachments).toHaveLength(0);
    expect(mail.html).toContain(`${RESUME_URL}/confirm`);
  });

  test('an empty attachments array sends the same message as before', async () => {
    await requestApprovalInEmail.run(buildContext({ attachments: [] }));

    const mail = await sentMail();
    expect(mail.attachments).toHaveLength(0);
    expect(mail.html).toContain(`${RESUME_URL}/confirm`);
  });
});
