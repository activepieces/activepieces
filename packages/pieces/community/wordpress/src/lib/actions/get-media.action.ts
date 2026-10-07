import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { getMediaOutputSchema } from '../output-schemas';

export const getMediaAction = createAction({
  auth: wordpressAuth,
  name: 'get_media',
  classification: 'READ',
  displayName: 'Get Media',
  description: 'Gets one media library file by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one WordPress media library item by ID, with its file URL, MIME type, alt text, caption and image sizes. Get the ID from list_media or upload_media. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getMediaOutputSchema,
  props: {
    media_id: Property.Number({
      displayName: 'Media ID',
      description: 'ID of the media item, from list_media or upload_media.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.media_id, propName: 'Media ID' });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/media/${id}`,
    });
    return response.body;
  },
});
