import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpMessageBody } from '@activepieces/pieces-common';
import { extractaAIAuth } from '../../index';
import { API_URL, batchIdDropdown } from '../common';
import FormData from 'form-data';

export const uploadFile = createAction({
    auth: extractaAIAuth,
    name: 'upload_file',
    displayName: 'Upload File',
    description: 'Uploads a document for extraction.',
    props: {
        extractionId: Property.ShortText({
            displayName: 'Extraction ID',
            description: 'Paste the ID of the extraction process. (This must be manually entered as the API does not support listing extractions).',
            required: true,
        }),
        file: Property.File({
            displayName: 'File',
            description: 'The document or image file to be processed (e.g., PDF, DOCX, PNG, JPG).',
            required: true,
        }),
        batchId: batchIdDropdown,
    },
    async run(context) {
        const { extractionId, file, batchId } = context.propsValue;
        const { auth } = context;

        const formData = new FormData();

        // Append form fields
        formData.append('extractionId', extractionId);
        if (batchId) {
            formData.append('batchId', batchId);
        }

        // Append the file data with the field name 'files'
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

        // Return the API response body
        return response.body;
    },
});