import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaUploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload an asset to your Canva content library',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Name for the uploaded asset',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload (image, video, or audio)',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Optional folder ID to upload the asset to',
      required: false,
    }),
  },
  async run(context) {
    const { name, file, parentFolderId } = context.propsValue;
    const accessToken = context.auth.access_token;

    // Start upload job
    const uploadBody: Record<string, unknown> = {
      name,
    };
    if (parentFolderId) {
      uploadBody['parent_folder_id'] = parentFolderId;
    }

    const startResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/asset-uploads',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify(uploadBody),
      },
      body: file.data,
    });

    const jobId = startResponse.body.job.id;

    // Poll for completion
    let status = 'in_progress';
    let result = null;
    const maxAttempts = 30;
    let attempts = 0;

    while (status === 'in_progress' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;

      const statusResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.canva.com/rest/v1/asset-uploads/${jobId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      status = statusResponse.body.job.status;
      if (status === 'success') {
        result = statusResponse.body.job.asset;
      } else if (status === 'failed') {
        throw new Error(`Asset upload failed: ${JSON.stringify(statusResponse.body.job.error)}`);
      }
    }

    if (status === 'in_progress') {
      throw new Error('Asset upload timed out');
    }

    return result;
  },
});
