import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscription } from '../../common/types';
import { kitSubscriptionOutputSchema } from '../../output-schemas';

export const kitTagSubscriber = createAction({
  auth: convertkitAuth,
  name: 'kit_tag_subscriber',
  classification: 'WRITE',
  outputSchema: kitSubscriptionOutputSchema,
  displayName: 'Tag Subscriber',
  description: 'Apply a tag to a subscriber by email, creating the subscriber if needed.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Applies a tag (plus optional extra tags) to a subscriber by email, creating the subscriber if missing and optionally setting first name and custom fields. Re-applying the same tag is a no-op. Tagging can start automations tied to that tag and may reactivate an address that unsubscribed. To act on a subscriber ID, get the email with Get Subscriber first.',
    idempotent: true,
  },
  props: {
    tag_id: kitProps.id('Tag ID', 'The tag to apply, from List Tags or Create Tag.'),
    email: kitProps.email('The subscriber email address.'),
    additional_tag_ids: kitProps.tagIds('Additional Tag IDs', 'More tag IDs to apply in the same call.'),
    first_name: kitProps.firstName,
    fields: kitProps.fields,
  },
  async run(context) {
    const { tag_id, email, additional_tag_ids, first_name, fields } = context.propsValue;
    const response = await kitClient.request<{ subscription: Subscription }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/tags/${kitCommon.id({ value: tag_id, label: 'Tag ID' })}/subscribe`,
      body: kitCommon.compact({
        email: kitCommon.email({ value: email, label: 'Email' }),
        first_name,
        fields: kitCommon.toFields(fields),
        tags: kitCommon.toIdList(additional_tag_ids),
      }),
    });
    return response.body.subscription;
  },
});
