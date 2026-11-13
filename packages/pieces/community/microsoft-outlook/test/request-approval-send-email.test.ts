/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';

const postMock = vi.fn().mockResolvedValue({});

vi.mock('../src/lib/common/client', () => ({
  outlookCommon: {
    createClient: () => ({ api: () => ({ post: postMock }) }),
    mailboxPrefix: () => '/me',
  },
}));

import { requestApprovalInMail } from '../src/lib/actions/request-approval-send-email';

const RESUME_URL = 'https://cloud.activepieces.com/api/v1/flow-runs/run-1/waitpoints/wp-1';
const PUBLIC_RESUME_URL = 'https://embed.example.com/api/v1/flow-runs/run-1/waitpoints/wp-1';

function buildContext({ publicResumeUrl }: { publicResumeUrl?: string }) {
  const context = createMockActionContext({
    propsValue: { recipients: 'approver@example.com', subject: 'Please approve', body: 'Order A-1' },
  });
  return {
    ...context,
    auth: { access_token: 'access-token' },
    run: {
      ...context.run,
      createWaitpoint: async () => ({ id: 'wp-1', resumeUrl: RESUME_URL, publicResumeUrl, buildResumeUrl: () => RESUME_URL }),
      waitForWaitpoint: () => undefined,
    },
  };
}

function sentHtml(): string {
  expect(postMock).toHaveBeenCalledTimes(1);
  return postMock.mock.calls[0][0].message.body.content;
}

describe('outlook request approval email', () => {
  beforeEach(() => {
    postMock.mockClear();
  });

  test('links the email button to the public resume url', async () => {
    await requestApprovalInMail.run(buildContext({ publicResumeUrl: PUBLIC_RESUME_URL }));
    expect(sentHtml()).toContain(`href="${PUBLIC_RESUME_URL}/confirm"`);
  });

  test('falls back to the resume url when the server sends no public one', async () => {
    await requestApprovalInMail.run(buildContext({}));
    expect(sentHtml()).toContain(`href="${RESUME_URL}/confirm"`);
  });
});
