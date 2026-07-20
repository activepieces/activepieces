/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { createApprovalLink } from '../src/lib/actions/create-approval-link';

const RESUME_URL =
  'https://cloud.activepieces.com/api/v1/flow-runs/run-id/waitpoints/wp-id';

function mockContext() {
  const ctx = createMockActionContext({ propsValue: {} });
  ctx.run.createWaitpoint = async () => ({
    id: 'wp-id',
    resumeUrl: RESUME_URL,
    buildResumeUrl: ({ queryParams }) =>
      `${RESUME_URL}?action=${queryParams['action']}`,
  });
  return ctx;
}

describe('createApprovalLink', () => {
  test('emits the scanner-safe /confirm page link', async () => {
    const result = await createApprovalLink.run(mockContext());
    expect(result.approvalLink).toBe(`${RESUME_URL}/confirm`);
    expect(result.disapprovalLink).toBe(`${RESUME_URL}/confirm`);
  });

  test('does not emit a bare action query link a scanner GET can consume', async () => {
    const result = await createApprovalLink.run(mockContext());
    expect(result.approvalLink).not.toContain('?action=');
    expect(result.disapprovalLink).not.toContain('?action=');
  });
});
