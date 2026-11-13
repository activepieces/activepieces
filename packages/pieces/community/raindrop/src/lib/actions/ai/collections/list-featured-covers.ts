import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropListFeaturedCoversOutputSchema } from '../../../output-schemas';

export const raindropListFeaturedCoversAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_featured_covers',
  outputSchema: raindropListFeaturedCoversOutputSchema,
  displayName: 'List Featured Covers',
  description: 'Lists the featured cover icon sets.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the featured cover icon sets, each with its icon image URLs. Pass a returned URL as a cover to Create Collection or Update Collection. Use Search Covers to find icons by keyword.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropListFeaturedCoversResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/collections/covers',
    });
  },
});

type RaindropListFeaturedCoversResponse = {
  result?: boolean;
  items: { title: string; icons: { png?: string; svg?: string }[] }[];
};
