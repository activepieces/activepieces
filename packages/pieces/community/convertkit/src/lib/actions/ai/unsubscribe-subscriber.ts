import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscriber } from '../../common/types';
import { kitSubscriberOutputSchema } from '../../output-schemas';

export const kitUnsubscribeSubscriber = createAction({
  auth: convertkitAuth,
  name: 'kit_unsubscribe_subscriber',
  classification: 'DESTRUCTIVE',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribe an email address from all forms and sequences.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unsubscribes an email address from every form, sequence and future email on the account; Kit has no delete-subscriber endpoint, so this is the removal action. Only the subscriber can reliably opt back in. To act on a subscriber ID, get the email with Get Subscriber first. Safe to retry: an already unsubscribed address returns the same cancelled record.',
    idempotent: true,
  },
  props: {
    email: kitProps.email('The email address to unsubscribe.'),
  },
  async run(context) {
    const response = await kitClient.request<{ subscriber: Subscriber }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: '/unsubscribe',
      body: { email: kitCommon.email({ value: context.propsValue.email, label: 'Email' }) },
    });
    return response.body.subscriber;
  },
});
