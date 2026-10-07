import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { mediaEditOutputSchema } from '../output-schemas';

export const uploadMediaAction = createAction({
  auth: wordpressAuth,
  name: 'upload_media',
  classification: 'WRITE',
  displayName: 'Upload Media',
  description: 'Uploads a file to the media library, with optional title, alt text, caption and description.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a file (image, PDF, video and so on) to the WordPress media library in one request, optionally setting its title, alt text, caption, description and the post it is attached to. Returns the media ID and public URL; pass the ID as featured_media to create_blog_post. Each call uploads a new copy, so retries duplicate. The site limits allowed file types and size.',
    idempotent: false,
  },
  outputSchema: mediaEditOutputSchema,
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload, as a URL or base64 data. The file name and extension decide its type.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Media title. Defaults to the file name.',
      required: false,
    }),
    alt_text: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Alternative text describing the image for screen readers.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Caption shown with the file.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Longer description of the file.',
      required: false,
    }),
    post: Property.Number({
      displayName: 'Attach To Post ID',
      description: 'ID of the post or page to attach the file to, from list_posts or list_pages.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('file', propsValue.file.data, { filename: propsValue.file.filename });
    const fields = wordpressContent.buildMediaDetailsBody({ values: propsValue });
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, String(value));
    }
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: '/media',
      body: form,
    });
    return response.body;
  },
});
