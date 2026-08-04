import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dropToCdnAuth } from '../auth';
import { dropToCdnApiCall } from '../client';

export const deleteFile = createAction({
  auth: dropToCdnAuth,
  name: 'delete_file',
  displayName: 'Delete File',
  description: 'Permanently delete a file by ID. This action cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a file from Drop to CDN by file ID. Use for pipeline cleanup after delivery. Idempotent for already-deleted files may return 404.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The file ID from Upload File or your Drop to CDN dashboard.',
      required: true,
    }),
  },
  async run(context) {
    const fileId = context.propsValue.file_id.trim();
    if (!fileId) {
      throw new Error('File ID is required.');
    }

    await dropToCdnApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUri: `/files/${encodeURIComponent(fileId)}`,
    });

    return { id: fileId, deleted: true };
  },
});
