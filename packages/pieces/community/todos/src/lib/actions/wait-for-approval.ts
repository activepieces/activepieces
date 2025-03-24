import { httpClient } from '@activepieces/pieces-common';
import { AuthenticationType } from '@activepieces/pieces-common';
import { HttpRequest } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { PauseType } from '@activepieces/shared';
import { ExecutionType } from '@activepieces/shared';
import { MarkdownVariant } from '@activepieces/shared';

export const waitForApproval = createAction({
  name: 'wait_for_approval',
  displayName: 'Wait for Approval',
  description: 'Pauses the flow and wait for the approval from the user',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: 'Continue the flow once the todo task is resolved',
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to wait for approval',
      required: true,
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
  async test(ctx) {
    console.log("HAHAHAHAH ctx.propsValue.taskId", ctx.propsValue.taskId);
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${ctx.server.publicUrl}v1/todos/${ctx.propsValue.taskId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: ctx.server.token,
      },
    };
    const response = await httpClient.sendRequest(request);
    return {
      status: response.body.status.name,
    };
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
