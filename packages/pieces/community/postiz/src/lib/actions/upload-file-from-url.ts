import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall } from '../common';

export const uploadFileFromUrl = createAction({
  auth: postizAuth,
  name: 'upload_file_from_url',
  displayName: 'Upload File from URL',
  description:
    'Upload a media file from a URL to Postiz. Returns the file path to use when creating posts.',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads an image or video from a public URL and uploads it into Postiz media storage, returning a file path to attach to Create Post. Use this first whenever a post needs media. Requires a publicly reachable file URL. Not idempotent — each call uploads a new media file.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'The public URL of the image or video to upload',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<{
      id: string;
      name: string;
      path: string;
      organizationId: string;
      createdAt: string;
      updatedAt: string;
    }>({
      auth,
      method: HttpMethod.POST,
      path: '/upload-from-url',
      body: {
        url: context.propsValue.url,
      },
    });

    const file = response.body;
    return {
      id: file.id,
      name: file.name,
      path: file.path,
      organization_id: file.organizationId,
      created_at: file.createdAt,
      updated_at: file.updatedAt,
    };
  },
});
