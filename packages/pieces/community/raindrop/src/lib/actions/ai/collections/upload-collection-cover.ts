import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUploadCollectionCoverOutputSchema } from '../../../output-schemas';

export const raindropUploadCollectionCoverAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_upload_collection_cover',
  outputSchema: raindropUploadCollectionCoverOutputSchema,
  displayName: 'Upload Collection Cover',
  description: 'Uploads an image file as the cover of a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a PNG, GIF or JPEG file and sets it as the cover of a collection, replacing the current one. Get the collection ID from List Collections or List Child Collections. To set a cover from a URL use Update Collection instead.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({ required: true }),
    cover: Property.File({
      displayName: 'Cover Image',
      description: 'PNG, GIF or JPEG image file.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('cover', new Blob([propsValue.cover.data]), propsValue.cover.filename);
    return await raindropClient.request<RaindropUploadCollectionCoverResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}/cover`,
      body: form,
    });
  },
});

type RaindropUploadCollectionCoverResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
