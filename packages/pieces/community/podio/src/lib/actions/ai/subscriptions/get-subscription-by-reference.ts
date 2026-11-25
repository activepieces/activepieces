import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSubscriptionByIdOutputSchema } from '../../../output-schemas';

export const getSubscriptionByReferenceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_subscription_by_reference',
  outputSchema: podioGetSubscriptionByIdOutputSchema,
  displayName: 'Get Subscription By Reference',
  description: 'Gets your subscription to an object such as an item, task, app or workspace.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s Podio subscription to one object, such as an item, task, status, app or workspace, and fails with Not found when the user does not follow it. Use it to check whether the user gets notifications about the object.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status", "app" or "space".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from Get Item, Get Task, Get Status, Get App or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/subscription/${propsValue.refType}/${propsValue.refId}` });
  },
});
