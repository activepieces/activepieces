import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropDeleteBookmarkOutputSchema } from '../../../output-schemas';

export const raindropDeleteBookmarkAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_bookmark',
  outputSchema: raindropDeleteBookmarkOutputSchema,
  displayName: 'Delete Bookmark',
  description: 'Moves a bookmark to Trash, or deletes it permanently if already in Trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one bookmark by ID (from List Bookmarks). The first call moves it to Trash (recoverable); calling it on a bookmark already in Trash deletes it permanently, so do not repeat it. Use Delete Bookmarks for many at once.',
    idempotent: false,
  },
  props: {
    raindropId: raindropAiProps.raindropId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropDeleteBookmarkResponse>({
      auth,
      method: HttpMethod.DELETE,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
    });
  },
});

type RaindropDeleteBookmarkResponse = {
  result: boolean;
};
