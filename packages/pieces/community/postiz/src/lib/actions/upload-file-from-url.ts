import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, requireText } from '../common';

function checkFileUrl({ value }: { value: unknown }): string {
  const url = requireText({ value, label: 'File URL' });
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    throw new Error(`File URL is not a valid URL: ${url}`);
  }
  const lastSegment = pathname.split('/').pop() ?? '';
  if (!lastSegment.includes('.')) {
    return url;
  }
  const extension = lastSegment.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`File URL must end in one of: ${ALLOWED_EXTENSIONS.join(', ')}.`);
  }
  return url;
}

export const uploadFileFromUrl = createAction({
  auth: postizAuth,
  name: 'upload_file_from_url',
  classification: 'WRITE',
  displayName: 'Upload File from URL',
  description:
    'Upload a media file from a URL to Postiz. Returns the file path to use when creating posts.',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads an image or video from a public URL and uploads it into Postiz media storage, returning the media ID and path to attach to a post. Use this first whenever a post needs media. Requires a publicly reachable file URL whose path ends in png, jpg, jpeg, gif, webp or mp4. Not idempotent — each call uploads a new media file.',
    idempotent: false,
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Media ID' },
      { key: 'name', label: 'Name' },
      { key: 'path', label: 'Path', format: 'url' },
    ],
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
        url: checkFileUrl({ value: context.propsValue.url }),
      },
    });

    const file = response.body;
    return {
      id: file.id,
      name: file.name,
      path: file.path,
    };
  },
});

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4'];
