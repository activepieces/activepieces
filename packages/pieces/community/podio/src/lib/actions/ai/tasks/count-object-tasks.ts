import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCountObjectTasksOutputSchema } from '../../../output-schemas';

export const countObjectTasksAction = createAction({
  auth: podioAuth,
  name: 'podio_count_object_tasks',
  outputSchema: podioCountObjectTasksOutputSchema,
  displayName: 'Count Object Tasks',
  description: 'Counts the open tasks on an item or other object.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many open tasks the connected user has on one Podio object, chosen by Reference Type and Reference ID. Use List Object Tasks to get the tasks themselves.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Reference Type', description: 'The type of object, such as "item", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the object.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/task/${propsValue.refType}/${propsValue.refId}/count` });
  },
});
