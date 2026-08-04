import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dropToCdnAuth } from '../auth';
import { dropToCdnApiCall } from '../client';

export const getFile = createAction({
  auth: dropToCdnAuth,
  name: 'get_file',
  displayName: 'Get File Information',
  description: 'Get CDN URL and metadata for a file by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the public CDN URL, expiry, size, MIME type, and original name for an existing file by its Drop to CDN file ID. Read-only and idempotent.',
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

    return dropToCdnApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/files/${encodeURIComponent(fileId)}`,
    });
  },
});
