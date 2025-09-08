import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudConvertAuth } from '../auth';

export const downloadFile = createAction({
  name: 'download_file',
  displayName: 'Download a File',
  description: 'Download output from a completed export/url task.',
  auth: cloudConvertAuth,
  props: {
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'The URL returned by an export/url task result.',
      required: true,
    }),
    returnAsBase64: Property.Checkbox({
      displayName: 'Return as Base64',
      description: 'If enabled, returns the file content as base64 instead of a URL.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const url = context.propsValue['fileUrl'] as string;
    const asBase64 = context.propsValue['returnAsBase64'] as boolean;

    if (!asBase64) {
      return { url };
    }

    const res = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url,
      responseType: 'arraybuffer',
    });

    const buf = Buffer.from(res.body as unknown as ArrayBuffer);
    return {
      base64: buf.toString('base64'),
      contentLength: res.headers?.['content-length'],
      contentType: res.headers?.['content-type'],
    };
  },
});