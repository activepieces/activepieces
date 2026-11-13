/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequestMock } = vi.hoisted(() => ({ sendRequestMock: vi.fn().mockResolvedValue({ status: 200, body: {} }) }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: sendRequestMock } };
});

import { discordSendApprovalMessage } from '../src/lib/actions/send-approval-message';

const RESUME_URL = 'https://cloud.activepieces.com/api/v1/flow-runs/run-1/waitpoints/wp-1';
const PUBLIC_RESUME_URL = 'https://embed.example.com/api/v1/flow-runs/run-1/waitpoints/wp-1';

function buildContext({ publicResumeUrl }: { publicResumeUrl?: string }) {
  const context = createMockActionContext({
    propsValue: { channel: 'channel-1', content: 'Please approve' },
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
  return sendRequestMock.mock.calls[0][0].body.components[0].components[0].url;
}

describe('discord send approval message', () => {
  beforeEach(() => {
    sendRequestMock.mockClear();
  });

  test('links the button to the public resume url', async () => {
    await discordSendApprovalMessage.run(buildContext({ publicResumeUrl: PUBLIC_RESUME_URL }));
    expect(sentButtonUrl()).toBe(`${PUBLIC_RESUME_URL}/confirm`);
  });

  test('falls back to the resume url when the server sends no public one', async () => {
    await discordSendApprovalMessage.run(buildContext({}));
    expect(sentButtonUrl()).toBe(`${RESUME_URL}/confirm`);
  });
});
