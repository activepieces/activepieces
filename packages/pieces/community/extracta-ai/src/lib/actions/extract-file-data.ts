import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpMessageBody } from '@activepieces/pieces-common';
import { extractaAIAuth } from '../../index';
import { API_URL, batchIdDropdown } from '../common';
import FormData from 'form-data';

export const extractFileData = createAction({
    auth: extractaAIAuth,
    name: 'extract_file_data',
    displayName: 'Extract File Data',
    description: 'Upload a file to an existing extraction process.',
    props: {
        extractionId: Property.ShortText({
            displayName: 'Extraction ID',
            description: 'Paste the ID of the extraction process. (The API does not support listing extractions, so this cannot be a dropdown).',
            required: true,
        }),
        // Replaced the inline dropdown with the imported one
        batchId: batchIdDropdown,
        file: Property.File({
            displayName: 'File',
            description: 'The file to be processed (e.g., PDF, DOCX, PNG, JPG, TXT).',
            required: true,
        }),
    },
    async run(context) {
        const { extractionId, file, batchId } = context.propsValue;
        const { auth } = context;

        const formData = new FormData();
        formData.append('extractionId', extractionId);
        if (batchId) {
            formData.append('batchId', batchId);
        }
        formData.append('files', file.data, file.filename);

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${API_URL}/uploadFiles`,
            body: formData as HttpMessageBody,
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${auth}`,
            },
        });

        return response.body;
    },
});