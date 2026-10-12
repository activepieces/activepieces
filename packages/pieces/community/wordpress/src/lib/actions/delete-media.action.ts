import { createAction, Property } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';
import { wordpressApi } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { deleteMediaOutputSchema } from '../output-schemas';

export const deleteMediaAction = createAction({
  auth: wordpressAuth,
  name: 'delete_media',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Media',
  description: 'Permanently deletes a media file and its generated sizes. This cannot be undone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a WordPress media item and removes its files from the server; media has no trash by default, so there is no recoverable alternative. Posts that used it as a featured image or embedded it will show a missing image. A repeat call fails because the item no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteMediaOutputSchema,
  props: {
    media_id: Property.Number({
      displayName: 'Media ID',
      description: 'ID of the media item to delete, from list_media.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.media_id, propName: 'Media ID' });
    return wordpressApi.forceDelete({ auth, path: `/media/${id}` });
  },
});
