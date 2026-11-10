import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscriber } from '../../common/types';
import { kitSubscriberOutputSchema } from '../../output-schemas';

export const kitGetSubscriber = createAction({
  auth: convertkitAuth,
  name: 'kit_get_subscriber',
  classification: 'READ',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Get Subscriber',
  description: 'Get one subscriber by subscriber ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one subscriber by ID: email, first name, state and custom field values. To look someone up by email, use List Subscribers with the Email Address filter instead.',
    idempotent: true,
  },
  props: {
    subscriber_id: kitProps.id('Subscriber ID', 'The subscriber ID, from List Subscribers.'),
  },
  async run(context) {
    const response = await kitClient.request<{ subscriber: Subscriber }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/subscribers/${kitCommon.id({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' })}`,
    });
    return response.body.subscriber;
  },
});
