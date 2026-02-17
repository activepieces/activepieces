import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaUploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_canva_asset',
  description: 'Upload an asset to the Canva content library',
  displayName: 'Upload Asset',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'The name of the asset (1-50 characters).',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description:
        'The file to upload. Supported formats: JPG, PNG, SVG, WEBP, GIF, MP4, MOV, MPEG, PDF, AI, EPS.',
      required: true,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const metadata = JSON.stringify({
      name_base64: Buffer.from(context.propsValue.name).toString('base64'),
    });

    const uploadResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/asset-uploads',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': metadata,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    const jobId = uploadResponse.body.job.id;

    // Poll for job completion
    let job = uploadResponse.body.job;
    while (job.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.canva.com/rest/v1/asset-uploads/${jobId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });
      job = statusResponse.body.job;
    }

    return job;
  },
});
