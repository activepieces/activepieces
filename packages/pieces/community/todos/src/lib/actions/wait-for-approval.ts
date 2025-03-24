import { createAction, Property } from '@activepieces/pieces-framework';
import { PauseType } from '@activepieces/shared';
import { ExecutionType } from '@activepieces/shared';
import { MarkdownVariant } from '@activepieces/shared';

export const waitForApproval = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: 'Continue the flow once the todo task is resolved',
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

      return undefined;
    } else {
      // update status in backend
      return {
        status: ctx.resumePayload.queryParams['status'],
      };
    }
  },
});
