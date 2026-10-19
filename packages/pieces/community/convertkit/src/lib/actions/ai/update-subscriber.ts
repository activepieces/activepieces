import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscriber } from '../../common/types';
import { kitSubscriberOutputSchema } from '../../output-schemas';

export const kitUpdateSubscriber = createAction({
  auth: convertkitAuth,
  name: 'kit_update_subscriber',
  classification: 'WRITE',
  outputSchema: kitSubscriberOutputSchema,
  displayName: 'Update Subscriber',
  description: 'Update the email, first name or custom fields of a subscriber.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a subscriber by ID. Only the inputs you supply are sent, so omitted ones keep their stored value; an empty string in Custom Fields clears that field. It cannot change subscription state; use Unsubscribe Subscriber for that.',
    idempotent: true,
  },
  props: {
    subscriber_id: kitProps.id('Subscriber ID', 'The subscriber ID, from List Subscribers.'),
    email_address: Property.ShortText({
      displayName: 'New Email Address',
      description: 'Change the subscriber email address.',
      required: false,
    }),
    first_name: kitProps.firstName,
    fields: kitProps.fields,
  },
  async run(context) {
    const { subscriber_id, email_address, first_name, fields } = context.propsValue;
    const body: Record<string, unknown> = {};
    if (email_address !== undefined && email_address !== null && email_address !== '') {
      body['email_address'] = kitCommon.email({ value: email_address, label: 'New Email Address' });
    }
    if (first_name !== undefined && first_name !== null && first_name !== '') {
      body['first_name'] = first_name;
    }
    const customFields = kitCommon.toFields(fields);
    if (customFields) {
      body['fields'] = customFields;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of New Email Address, First Name or Custom Fields.');
    }
    const response = await kitClient.request<{ subscriber: Subscriber }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/subscribers/${kitCommon.id({ value: subscriber_id, label: 'Subscriber ID' })}`,
      body,
    });
    return response.body.subscriber;
  },
});
