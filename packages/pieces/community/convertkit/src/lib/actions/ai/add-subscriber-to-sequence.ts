import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscription } from '../../common/types';
import { kitSubscriptionOutputSchema } from '../../output-schemas';

export const kitAddSubscriberToSequence = createAction({
  auth: convertkitAuth,
  name: 'kit_add_subscriber_to_sequence',
  classification: 'WRITE',
  outputSchema: kitSubscriptionOutputSchema,
  displayName: 'Add Subscriber To Sequence',
  description: 'Enroll an email address in a sequence, creating the subscriber if needed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enrolls an email in a sequence, creating the subscriber if missing, and can set first name, custom fields and extra tags. This starts the sequence emails for that person and may reactivate an address that unsubscribed, so only use it with consent. Enrolling the same email again does not create a second enrollment. Get the sequence ID from List Sequences.',
    idempotent: true,
  },
  props: {
    sequence_id: kitProps.id('Sequence ID', 'The sequence ID, from List Sequences.'),
    email: kitProps.email('The email address to enroll.'),
    first_name: kitProps.firstName,
    fields: kitProps.fields,
    tag_ids: kitProps.tagIds('Tag IDs', 'Optional tag IDs to apply as well, from List Tags.'),
  },
  async run(context) {
    const { sequence_id, email, first_name, fields, tag_ids } = context.propsValue;
    const response = await kitClient.request<{ subscription: Subscription }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/sequences/${kitCommon.id({ value: sequence_id, label: 'Sequence ID' })}/subscribe`,
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
