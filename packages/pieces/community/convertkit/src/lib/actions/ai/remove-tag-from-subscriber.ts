import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Tag } from '../../common/types';
import { kitRemoveTagFromSubscriberOutputSchema } from '../../output-schemas';

export const kitRemoveTagFromSubscriber = createAction({
  auth: convertkitAuth,
  name: 'kit_remove_tag_from_subscriber',
  classification: 'WRITE',
  outputSchema: kitRemoveTagFromSubscriberOutputSchema,
  displayName: 'Remove Tag From Subscriber',
  description: 'Remove a tag from a subscriber identified by subscriber ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one tag from a subscriber by subscriber ID; the subscriber stays subscribed. Use Remove Tag By Email when you only have the address. Safe to retry: removing a tag the subscriber no longer has still succeeds.',
    idempotent: true,
  },
  props: {
    subscriber_id: kitProps.id('Subscriber ID', 'The subscriber ID, from List Subscribers or Get Subscriber.'),
    tag_id: kitProps.id('Tag ID', 'The tag to remove, from List Tags.'),
  },
  async run(context) {
    const subscriberId = kitCommon.id({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' });
    const tagId = kitCommon.id({ value: context.propsValue.tag_id, label: 'Tag ID' });
    const response = await kitClient.request<Tag>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/subscribers/${subscriberId}/tags/${tagId}`,
    });
    return {
      removed: true,
      subscriber_id: subscriberId,
      tag_id: response.body?.id ?? Number(tagId),
      tag_name: response.body?.name,
    };
  },
});
