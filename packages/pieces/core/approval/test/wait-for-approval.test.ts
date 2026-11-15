/// <reference types="vitest/globals" />

import {
  createMockActionContext,
  ExecutionType,
} from '@activepieces/pieces-framework';
import { waitForApprovalLink } from '../src/lib/actions/wait-for-approval';

describe('waitForApprovalLink resume', () => {
  test('reads an answer without action=approve as a decline', async () => {
    const ctx = createMockActionContext({
      propsValue: {},
      resumePayload: { body: {}, headers: {}, queryParams: {} },
    });
    await expect(waitForApprovalLink.run(ctx)).resolves.toEqual({
      approved: false,
    });
  });

  test('fails with a clear message when the resume carries no answer', async () => {
    const ctx = {
      ...createMockActionContext({ propsValue: {} }),
      executionType: ExecutionType.RESUME,
    };
    await expect(waitForApprovalLink.run(ctx)).rejects.toThrow(
      'Wait for Approval resumed without an approval answer',
    );
  });
});
