import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType, MarkdownVariant, PauseType } from '@activepieces/shared';

export const waitForApprovalLink = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.WARNING,
      value: 'Please use Manual Task feature instead from 0.48.0 and above',
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {}
        },
      });

      return {
        approved: true,
      };
    } else {
      return {
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
      };
    }
  },
});
