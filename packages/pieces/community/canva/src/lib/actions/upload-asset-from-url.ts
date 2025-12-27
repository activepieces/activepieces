import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaUploadAssetFromUrl = createAction({
  auth: canvaAuth,
  name: 'upload_asset_from_url',
  displayName: 'Upload Asset from URL',
  description: 'Upload an asset to Canva from a public URL',
  props: {
    name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Name for the uploaded asset',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Asset URL',
      description: 'Public URL of the asset to upload',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Optional folder ID to upload the asset to',
      required: false,
    }),
  },
  async run(context) {
    const { name, url, parentFolderId } = context.propsValue;
    const accessToken = context.auth.access_token;

    const body: Record<string, unknown> = {
      name,
      url,
    };
    if (parentFolderId) {
      body['parent_folder_id'] = parentFolderId;
    }

    // Start URL upload job
    const startResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/url-asset-uploads',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
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
        url: `https://api.canva.com/rest/v1/url-asset-uploads/${jobId}`,
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
