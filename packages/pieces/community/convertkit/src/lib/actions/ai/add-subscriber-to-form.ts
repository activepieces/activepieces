import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscription } from '../../common/types';
import { kitSubscriptionOutputSchema } from '../../output-schemas';

export const kitAddSubscriberToForm = createAction({
  auth: convertkitAuth,
  name: 'kit_add_subscriber_to_form',
  classification: 'WRITE',
  outputSchema: kitSubscriptionOutputSchema,
  displayName: 'Add Subscriber To Form',
  description: 'Subscribe an email address to a form, creating the subscriber if needed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Subscribes an email to a form, creating the subscriber if missing, and can set first name, custom fields and extra tags. This is the main way to add a subscriber. Each call can send the form double opt-in or incentive email and may reactivate an address that unsubscribed, so only use it with consent; retries can resend that email. To act on a subscriber ID, get the email with Get Subscriber first.',
    idempotent: false,
  },
  props: {
    form_id: kitProps.id('Form ID', 'The form ID, from List Forms.'),
    email: kitProps.email('The email address to subscribe.'),
    first_name: kitProps.firstName,
    fields: kitProps.fields,
    tag_ids: kitProps.tagIds('Tag IDs', 'Optional tag IDs to apply as well, from List Tags.'),
  },
  async run(context) {
    const { form_id, email, first_name, fields, tag_ids } = context.propsValue;
    const response = await kitClient.request<{ subscription: Subscription }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/forms/${kitCommon.id({ value: form_id, label: 'Form ID' })}/subscribe`,
      body: kitCommon.compact({
        email: kitCommon.email({ value: email, label: 'Email' }),
        first_name,
        fields: kitCommon.toFields(fields),
        tags: kitCommon.toIdList(tag_ids),
      }),
    });
    return response.body.subscription;
  },
});
