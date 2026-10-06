import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { presentonAuth } from '../../common/auth';
import { presentonClient } from '../../common/client';
import { presentationGetTaskStatusOutputSchema } from '../../output-schemas';

export const getTaskStatus = createAction({
  auth: presentonAuth,
  name: 'presentation_get_task_status',
  outputSchema: presentationGetTaskStatusOutputSchema,
  displayName: 'Get Task Status',
  description: 'Check the status of an asynchronous Presenton task.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the current status of a Presenton async task once, returning status, message, error and result data when completed. Use the id returned by presentation_generate_presentation when it did not finish within its wait window.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({ displayName: 'Task ID', description: 'Task id returned by presentation_generate_presentation.', required: true }),
  },
  async run({ auth, propsValue }) {
    return presentonClient.request<Record<string, unknown>>({
      auth: auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v3/async-task/status/${encodeURIComponent(propsValue.id)}`,
    });
  },
});
