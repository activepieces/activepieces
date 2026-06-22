import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall } from '../common';

export const listMedia = createAction({
  auth: letmepostAuth,
  name: 'list_media',
  displayName: 'List Media',
  description: 'List previously uploaded media assets',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists uploaded media assets, returning each id, URL, content type, and size. Use to find an existing media id to reuse in Publish a Post instead of re-uploading. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of media assets to return.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const { limit } = context.propsValue;

    const response = await letmepostApiCall<{
      data: {
        id: string;
        url: string;
        contentType: string;
        sizeBytes: number;
        createdAt: string;
      }[];
    }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v1/media',
      queryParams: { limit: String(limit ?? 50) },
    });

    return response.body.data;
  },
});
