import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListObjectTasksOutputSchema } from '../../../output-schemas';

export const listObjectTasksAction = createAction({
  auth: podioAuth,
  name: 'podio_list_object_tasks',
  outputSchema: podioListObjectTasksOutputSchema,
  displayName: 'List Object Tasks',
  description: 'Lists the tasks linked to an item or other object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every task, active and completed, linked to one Podio object chosen by Reference Type and Reference ID (an item id from the item actions, a status id from Create Status). Use List Tasks to filter across workspaces.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Reference Type', description: 'The type of object, such as "item", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the object.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/task/${propsValue.refType}/${propsValue.refId}/` });
    return { tasks: body, count: body.length };
  },
});
