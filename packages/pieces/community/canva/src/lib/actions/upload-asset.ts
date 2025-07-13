import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const uploadAssetAction = createAction({
    auth: canvaAuth,
    name: 'upload_asset',
    displayName: 'Upload Asset',
    description: 'Uploads a brand asset to the Canva content library.',
    props: {
        assetName: Property.ShortText({
            displayName: 'Asset Name',
            description: 'The name of the asset (maximum 50 characters).',
            required: true,
        }),
        file: Property.File({
            displayName: 'File',
            description: 'The asset file to upload.',
            required: true,
        }),
    },
    async run(context) {
        const { assetName, file } = context.propsValue;

        // Convert asset name to Base64 as Canva requires
        const assetNameBase64 = Buffer.from(assetName).toString('base64');

        // Prepare asset upload metadata header
        const assetUploadMetadata = JSON.stringify({
            name_base64: assetNameBase64,
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/rest/v1/asset-uploads`,
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Asset-Upload-Metadata': assetUploadMetadata,
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
