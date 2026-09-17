import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, MEDIA_FIELDS } from '../../common';

export const listMedia = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listMediaOutputSchema,
  name: 'list_media',
  classification: 'READ',
  displayName: 'List Media',
  description: 'List posts published by the connected Instagram account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the media (posts, reels and albums) published by the connected Instagram professional account, newest first, with caption, permalink, media type and engagement counts. Use it to find a recent post or its id before reading or commenting on it. Stories are not included — use List Stories for those. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of posts to return (default 25).',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{
      data?: unknown[];
      paging?: { cursors?: { after?: string } };
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}/media`,
      accessToken: page.accessToken,
      query: { fields: MEDIA_FIELDS, limit: propsValue.limit ?? 25 },
    });

    const media = response.data ?? [];
    return {
      media,
      count: media.length,
      next_cursor: response.paging?.cursors?.after,
    };
  },
});
