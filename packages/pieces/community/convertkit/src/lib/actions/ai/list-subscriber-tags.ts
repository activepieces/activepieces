import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Tag } from '../../common/types';
import { kitListTagsOutputSchema } from '../../output-schemas';

export const kitListSubscriberTags = createAction({
  auth: convertkitAuth,
  name: 'kit_list_subscriber_tags',
  classification: 'SEARCH',
  outputSchema: kitListTagsOutputSchema,
  displayName: 'List Subscriber Tags',
  description: 'List the tags applied to one subscriber.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every tag currently applied to one subscriber, by subscriber ID. When only an email is known, find the ID with List Subscribers and its Email Address filter first.',
    idempotent: true,
  },
  props: {
    subscriber_id: kitProps.id('Subscriber ID', 'The subscriber ID, from List Subscribers.'),
  },
  async run(context) {
    const response = await kitClient.request<{ tags: Tag[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/subscribers/${kitCommon.id({ value: context.propsValue.subscriber_id, label: 'Subscriber ID' })}/tags`,
    });
    const tags = response.body.tags ?? [];
    return { tags, count: tags.length };
  },
});
