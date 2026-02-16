import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCallRaw } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const uploadAssetAction = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an image or video asset to Canva',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'The name of the asset',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (image or video)',
      required: true,
    }),
  },
  async run(context) {
    const { name, file } = context.propsValue;

    const fileBuffer = Buffer.from(file.base64, 'base64');

    // Canva asset upload uses application/octet-stream with metadata in header
    const metadata = JSON.stringify({
      name_base64: Buffer.from(name).toString('base64'),
    });

    const response = await canvaApiCallRaw({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/asset-uploads',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': metadata,
        'Content-Length': String(fileBuffer.length),
      },
      body: fileBuffer,
    });

    return {
      job: response.job,
      success: true,
    };
  },
});
