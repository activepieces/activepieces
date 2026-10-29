import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Tag } from '../../common/types';
import { kitRemoveTagByEmailOutputSchema } from '../../output-schemas';

export const kitRemoveTagByEmail = createAction({
  auth: convertkitAuth,
  name: 'kit_remove_tag_by_email',
  classification: 'WRITE',
  outputSchema: kitRemoveTagByEmailOutputSchema,
  displayName: 'Remove Tag By Email',
  description: 'Remove a tag from a subscriber identified by email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one tag from the subscriber with the given email; the subscriber stays subscribed. Use Remove Tag From Subscriber when you have the subscriber ID instead. Safe to retry: removing a tag the subscriber no longer has still succeeds.',
    idempotent: true,
  },
  props: {
    tag_id: kitProps.id('Tag ID', 'The tag to remove, from List Tags.'),
    email: kitProps.email('The subscriber email address.'),
  },
  async run(context) {
    const email = kitCommon.email({ value: context.propsValue.email, label: 'Email' });
    const response = await kitClient.request<Tag>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/tags/${kitCommon.id({ value: context.propsValue.tag_id, label: 'Tag ID' })}/unsubscribe`,
      body: { email },
    });
    return {
      removed: true,
      email,
      tag_id: response.body?.id,
      tag_name: response.body?.name,
    };
  },
});
