import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropGetBookmarkOutputSchema } from '../../../output-schemas';

export const raindropGetBookmarkAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_get_bookmark',
  outputSchema: raindropGetBookmarkOutputSchema,
  displayName: 'Get Bookmark',
  description: 'Gets a single bookmark by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one bookmark by ID, including its tags, collection, cover and highlights. Use it when you already have the ID from List Bookmarks or Create Bookmark; use List Bookmarks to search by text instead.',
    idempotent: true,
  },
  props: {
    raindropId: raindropAiProps.raindropId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropGetBookmarkResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
    });
  },
});

type RaindropGetBookmarkResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
