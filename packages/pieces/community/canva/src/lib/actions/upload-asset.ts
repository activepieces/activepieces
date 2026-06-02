import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../auth';
import { CANVA_BASE_URL, pollJob } from '../common';

export const canvaUploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload a file as an asset to Canva.',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'The name of the asset.',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload as an asset.',
      required: true,
    }),
  },
  async run(context) {
    const { name, file } = context.propsValue;
    const accessToken = context.auth.access_token;

    const metadata = {
      name_base64: Buffer.from(name).toString('base64'),
    };
    const metadataBase64 = Buffer.from(JSON.stringify(metadata)).toString(
      'base64'
    );

    const response = await httpClient.sendRequest<{
      job: { id: string; status: string };
    }>({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/assets`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': metadataBase64,
      },
      body: file.data,
    });

    const jobId = response.body.job.id;

    const result = await pollJob<{
      job: {
        id: string;
        status: string;
        asset?: unknown;
        error?: unknown;
      };
    }>({
      accessToken,
      resourceUrl: `/assets/${jobId}`,
      isComplete: (body) =>
        body.job.status === 'success' || body.job.status === 'failed',
    });

    if (result.job.status === 'failed') {
      throw new Error(
        `Asset upload failed: ${JSON.stringify(result.job.error)}`
      );
    }

    return result.job;
  },
});
