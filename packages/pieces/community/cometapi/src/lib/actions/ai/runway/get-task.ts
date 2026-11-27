import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiRunwayGetTaskOutputSchema } from '../../../output-schemas';

export const runwayGetTaskAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_runway_get_task',
  outputSchema: cometapiRunwayGetTaskOutputSchema,
  displayName: 'Runway Get Task',
  description: 'Gets the status and output URLs of a Runway task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a Runway task once and returns its status (PENDING, THROTTLED, RUNNING, SUCCEEDED, FAILED, CANCELLED), progress, temporary output URLs and failure details. Takes the task id returned by any Runway create action (Text to Video, Image to Video, Video to Video, Upscale Video, Character Performance, Text to Image, Text to Speech, Speech to Speech, Dub Voice, Isolate Voice, Generate Sound Effect); call again later while not finished. A brand-new task can briefly return 400 task_not_exist; retry with the same id rather than re-creating it.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The id returned by a Runway create action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/runwayml/v1/tasks/${encodeURIComponent(propsValue.taskId)}`,
    });
  },
});
