import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioSubscribeOutputSchema } from '../../../output-schemas';

export const subscribeAction = createAction({
  auth: podioAuth,
  name: 'podio_subscribe',
  outputSchema: podioSubscribeOutputSchema,
  displayName: 'Subscribe',
  description: 'Follows an object such as an item, task, app or workspace to get its notifications.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Subscribes the connected user to one Podio object, such as an item, task, status, app or workspace, so they get notifications when it changes. Returns the subscription id; Unsubscribe By Reference or Unsubscribe By ID reverses it.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from Get Item, Get Task, Get Status, Get App or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/subscription/${propsValue.refType}/${propsValue.refId}` });
  },
});
