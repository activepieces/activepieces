import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUploadBookmarkCoverOutputSchema } from '../../../output-schemas';

export const raindropUploadBookmarkCoverAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_upload_bookmark_cover',
  outputSchema: raindropUploadBookmarkCoverOutputSchema,
  displayName: 'Upload Bookmark Cover',
  description: 'Uploads an image as the cover of a bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a PNG, GIF or JPEG file and sets it as the cover of one bookmark (ID from List Bookmarks), replacing the current cover. To set a cover from an image URL, use Update Bookmark instead.',
    idempotent: false,
  },
  props: {
    raindropId: raindropAiProps.raindropId({ required: true }),
    cover: Property.File({
      displayName: 'Cover Image',
      description: 'PNG, GIF or JPEG image file.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('cover', new Blob([propsValue.cover.data]), propsValue.cover.filename);
    return await raindropClient.request<RaindropUploadBookmarkCoverResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}/cover`,
      body: form,
    });
  },
});

type RaindropUploadBookmarkCoverResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
