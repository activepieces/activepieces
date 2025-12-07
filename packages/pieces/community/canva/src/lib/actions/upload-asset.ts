import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const uploadAsset = createAction({
  auth: canvaAuth,
  name: 'upload_asset',
  displayName: 'Upload Asset',
  description: 'Upload a brand asset to Canva',
  props: {
    asset_name: Property.ShortText({
      displayName: 'Asset Name',
      description: 'Name for the asset (1-50 characters)',
      required: true,
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the file to upload',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const assetName = context.propsValue.asset_name;
    const fileUrl = context.propsValue.file_url;

    // Download the file first
    const fileResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: fileUrl,
    });

    // Encode asset name in base64
    const nameBase64 = Buffer.from(assetName).toString('base64');

    // Upload the asset
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/${canvaCommon.assetUploads}`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({
          name_base64: nameBase64,
        }),
      },
      body: fileResponse.body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      job: response.body,
    };
  },
});
