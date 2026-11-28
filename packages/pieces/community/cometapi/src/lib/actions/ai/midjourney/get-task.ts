import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiMidjourneyGetTaskOutputSchema } from '../../../output-schemas';

export const midjourneyGetTaskAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_midjourney_get_task',
  outputSchema: cometapiMidjourneyGetTaskOutputSchema,
  displayName: 'Midjourney Get Task',
  description: 'Reads the status and result of one Midjourney task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Midjourney task once: status (NOT_START, SUBMITTED, IN_PROGRESS, SUCCESS, FAILURE), progress, imageUrl or videoUrl, failReason, and the buttons whose customId feeds Midjourney Action and Midjourney Modal. Takes the task id that any Midjourney submit action returns in result; call again later while the task runs, it never waits.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Task ID returned in result by a Midjourney submit action, e.g. Midjourney Imagine.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/mj/task/${encodeURIComponent(propsValue.taskId)}/fetch`,
    });
  },
});
