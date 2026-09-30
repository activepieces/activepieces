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

type ApprovalContext = Parameters<typeof requestApprovalInEmail.run>[0];

function buildContext(propsValue: Record<string, unknown>): ApprovalContext {
  const context = createMockActionContext({
    propsValue: {
      receiver: 'approver@example.com',
      subject: 'Please approve',
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

async function sentHtml(): Promise<string> {
  expect(sendMock).toHaveBeenCalledTimes(1);
  const raw = sendMock.mock.calls[0][0].requestBody.raw as string;
  const mail = await simpleParser(
    Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  );
  return typeof mail.html === 'string' ? mail.html : '';
}

describe('request approval in email — body type', () => {
  beforeEach(() => {
    sendMock.mockClear();
    listMock.mockClear();
  });

  test('a plain text body is escaped and keeps its line breaks', async () => {
    await requestApprovalInEmail.run(
      buildContext({ body_type: 'plain_text', body: 'a < b & c\nline 2' })
    );

    const html = await sentHtml();
    expect(html).toContain('a &lt; b &amp; c<br>line 2');
    expect(html).toContain(`${RESUME_URL}/confirm`);
  });

  test('a rich text body is sent as markup', async () => {
    await requestApprovalInEmail.run(
      buildContext({ body_type: 'html', body: '<p><strong>bold</strong></p>' })
    );

    const html = await sentHtml();
    expect(html).toContain('<p><strong>bold</strong></p>');
    expect(html).toContain(`${RESUME_URL}/confirm`);
  });
});
