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
