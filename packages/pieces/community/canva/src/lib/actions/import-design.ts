import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const importDesignAction = createAction({
    auth: canvaAuth,
    name: 'import_design',
    displayName: 'Import Design',
    description: 'Imports an external PDF or supported file as an editable Canva design.',
    props: {
        title: Property.ShortText({
            displayName: 'Design Title',
            description: 'The title of the design to import (Maximum 50 characters).',
            required: true,
        }),
        mimeType: Property.ShortText({
            displayName: 'MIME Type (Optional)',
            description: 'Optional. Specify the MIME type of the file (example: application/pdf). Canva will auto-detect if not provided.',
            required: false,
        }),
        file: Property.File({
            displayName: 'File to Import',
            description: 'Upload a PDF or other supported file to import into Canva as a new design.',
            required: true,
        }),
    },
    async run(context) {
        const { file, title, mimeType } = context.propsValue;

        const titleBase64 = Buffer.from(title).toString('base64');

        const metadata: Record<string, string> = {
            title_base64: titleBase64,
        };

        if (mimeType) {
            metadata['mime_type'] = mimeType;
        }

        const importMetadata = JSON.stringify(metadata);

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/rest/v1/imports`,
            body: file,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Import-Metadata': importMetadata,
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
        });

        return response.body;
    },
});
