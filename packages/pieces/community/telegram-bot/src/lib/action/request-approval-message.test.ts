/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequestMock } = vi.hoisted(() => ({ sendRequestMock: vi.fn().mockResolvedValue({ status: 200, body: { ok: true, result: { message_id: 7 } } }) }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: sendRequestMock } };
});

import '../../index';
import { telegramRequestApprovalMessageAction } from './request-approval-message';

const RESUME_URL = 'https://cloud.activepieces.com/api/v1/flow-runs/run-1/waitpoints/wp-1';
const PUBLIC_RESUME_URL = 'https://embed.example.com/api/v1/flow-runs/run-1/waitpoints/wp-1';

function buildContext({ publicResumeUrl }: { publicResumeUrl?: string }) {
  const context = createMockActionContext({
    propsValue: { chat_id: '12345', message: 'Please approve' },
  });
  return {
    ...context,
    auth: { secret_text: 'bot-token' },
    run: {
      ...context.run,
      createWaitpoint: async () => ({ id: 'wp-1', resumeUrl: RESUME_URL, publicResumeUrl, buildResumeUrl: () => RESUME_URL }),
      waitForWaitpoint: () => undefined,
    },
  };
}

function sentButtonUrl(): string {
  expect(sendRequestMock).toHaveBeenCalledTimes(1);
  return sendRequestMock.mock.calls[0][0].body.reply_markup.inline_keyboard[0][0].url;
}

describe('telegram request approval message', () => {
  beforeEach(() => {
    sendRequestMock.mockClear();
  });

  test('links the button to the public resume url and keeps the chat id', async () => {
    await telegramRequestApprovalMessageAction.run(buildContext({ publicResumeUrl: PUBLIC_RESUME_URL }));
    expect(sentButtonUrl()).toBe(`${PUBLIC_RESUME_URL}/confirm?chat_id=12345`);
  });

  test('falls back to the resume url when the server sends no public one', async () => {
    await telegramRequestApprovalMessageAction.run(buildContext({}));
    expect(sentButtonUrl()).toBe(`${RESUME_URL}/confirm?chat_id=12345`);
  });
});
