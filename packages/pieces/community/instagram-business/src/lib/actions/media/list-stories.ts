import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { listStoriesOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const listStories = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listStoriesOutputSchema,
  name: 'list_stories',
  classification: 'READ',
  displayName: 'List Stories',
  description: 'List the stories currently live on the connected Instagram account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the stories that are currently live on the connected Instagram professional account. Stories expire after 24 hours and disappear from this list once they do, so an empty result means nothing is live rather than that something failed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}/stories`,
      accessToken: page.accessToken,
      query: { fields: 'id,media_type,media_url,permalink,timestamp,thumbnail_url' },
    });

    const stories = response.data ?? [];
    return { stories, count: stories.length };
  },
});
