import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { Tag } from '../../common/types';
import { kitListTagsOutputSchema } from '../../output-schemas';

export const kitListTags = createAction({
  auth: convertkitAuth,
  name: 'kit_list_tags',
  classification: 'SEARCH',
  outputSchema: kitListTagsOutputSchema,
  displayName: 'List Tags',
  description: 'List the tags on the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every tag with its ID and name. Use it to resolve a tag name to the ID that Tag Subscriber, Remove Tag and List Tag Subscriptions need.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<{ tags: Tag[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/tags',
    });
    const tags = response.body.tags ?? [];
    return { tags, count: tags.length };
  },
});
