import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const unsubscribeByReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_unsubscribe_by_reference',
  displayName: 'Unsubscribe By Reference',
  description: 'Stops following an object such as an item, task, app or workspace.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Unsubscribes the connected user from one Podio object, such as an item, task, status, app or workspace, so they no longer get its notifications; Subscribe follows it again. Use it when you know the object but not the subscription id.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from Get Item, Get Task, Get Status, Get App or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/subscription/${propsValue.refType}/${propsValue.refId}` });
  },
});
