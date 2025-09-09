import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../../index';

export const downloadFileAction = createAction({
  auth: cloudconvertAuth,
  name: 'download_file',
  displayName: 'Download a File',
  description: 'Download a file from a public URL and return base64 content.',
  props: {
    file_url: Property.ShortText({
      displayName: 'File URL',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const { file_url } = propsValue;
    const res = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url: file_url,
      responseType: 'arraybuffer',
    });
    const b64 = Buffer.from(res.body as any).toString('base64');
    return {
      content_base64: b64,
      content_type: res.headers?.['content-type'] || 'application/octet-stream',
      content_length: res.headers?.['content-length'] || undefined,
      url: file_url,
    };
  },
});

