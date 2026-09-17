import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { listMediaOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, MEDIA_FIELDS } from '../../common';

export const listTaggedMedia = createAction({
  auth: instagramCommon.authentication,
  outputSchema: listMediaOutputSchema,
  name: 'list_tagged_media',
  classification: 'READ',
  displayName: 'List Tagged Media',
  description: 'List posts by other accounts that tagged this account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists posts published by other Instagram accounts in which the connected account was tagged. These belong to other people, so they cannot be edited or deleted, and the list is useful for monitoring brand mentions. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    limit: Property.Number({ displayName: 'Limit', required: false }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{
      data?: unknown[];
      paging?: { cursors?: { after?: string } };
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}/tags`,
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
