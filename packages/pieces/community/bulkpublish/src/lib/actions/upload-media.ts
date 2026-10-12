import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BULKPUBLISH_BASE_URL, bulkpublishAuth } from '../common';

export const uploadMedia = createAction({
  auth: bulkpublishAuth,
  name: 'upload_media',
  displayName: 'Upload Media',
  description: 'Upload an image or video (up to 100MB) to the media library. Use the returned ID in Create Post.',
  props: {
    file: Property.File({ displayName: 'File', description: 'File or URL to upload.', required: true }),
  },
  async run({ auth, propsValue }) {
    const file = propsValue.file;
    const form = new FormData();
    const mime = file.extension ? undefined : 'application/octet-stream';
    form.append('file', new Blob([new Uint8Array(file.data)], mime ? { type: mime } : {}), file.filename);
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BULKPUBLISH_BASE_URL}/api/media`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body: form,
    });
    return res.body;
  },
});
