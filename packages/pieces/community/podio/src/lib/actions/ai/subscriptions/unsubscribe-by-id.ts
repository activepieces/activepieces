import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const unsubscribeByIdAction = createAction({
  auth: podioAuth,
  name: 'podio_unsubscribe_by_id',
  displayName: 'Unsubscribe By ID',
  description: 'Stops a subscription by its id.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stops one Podio subscription by id, so the connected user no longer gets notifications about its object; Subscribe on the same object follows it again. The subscription id comes from Subscribe or Get Subscription By Reference.',
    idempotent: false,
  },
  props: {
    subscriptionId: podioAiProps.id({ required: true, displayName: 'Subscription ID', description: 'The id of the subscription, from Subscribe.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/subscription/${propsValue.subscriptionId}` });
  },
});
