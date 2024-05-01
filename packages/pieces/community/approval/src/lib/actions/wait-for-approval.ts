import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ExecutionType, PauseType } from '@activepieces/shared';

export const waitForApprovalLink = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {},
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  outputs: ['approved', 'denied'],
  async run(ctx) {
    if (ctx.executionType === ExecutionType.BEGIN) {
      ctx.run.pause({
        pauseMetadata: {
          type: PauseType.WEBHOOK,
          response: {},
        },
      });

      const request: HttpRequest<any> = {
        method: HttpMethod.GET,
        url: ctx.generateApprovalUrl({
          action: 'approved',
        }),
      };

      const res = await httpClient.sendRequest<{
        approved: boolean;
        denied: boolean;
      }>(request);

      return {
        approved: res.body.approved,
        denied: res.body.denied,
      };
    } else {
      return {
        approved: ctx.resumePayload.queryParams['action'] === 'approve',
        denied: ctx.resumePayload.queryParams['action'] !== 'approve',
      };
    }
  },
});
