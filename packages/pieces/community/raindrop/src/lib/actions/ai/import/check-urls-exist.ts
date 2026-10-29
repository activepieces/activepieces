import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropCheckUrlsExistOutputSchema } from '../../../output-schemas';

export const raindropCheckUrlsExistAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_check_urls_exist',
  outputSchema: raindropCheckUrlsExistOutputSchema,
  displayName: 'Check URLs Exist',
  description: 'Checks whether URLs are already saved as bookmarks.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks which of the given URLs are already saved in Raindrop.io and returns the IDs of the matching bookmarks (empty when none are saved). Call it before Create Bookmark to avoid duplicates. Requires at least one URL.',
    idempotent: true,
  },
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'URLs to look up, e.g. ["https://example.com/a", "https://example.com/b"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const urls = raindropUtils.toStringList({ value: propsValue.urls });
    if (urls.length === 0) {
      throw new Error('urls must contain at least one URL.');
    }
    return await raindropClient.request<RaindropCheckUrlsExistResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/import/url/exists',
      body: { urls },
    });
  },
});

type RaindropCheckUrlsExistResponse = {
  result: boolean;
  ids: number[];
};
