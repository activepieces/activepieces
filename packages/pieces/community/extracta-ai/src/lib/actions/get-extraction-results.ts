import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { extractaAIAuth } from '../../index';
import { API_URL, requiredBatchIdDropdown, fileIdDropdown } from '../common';

export const getExtractionResults = createAction({
    auth: extractaAIAuth,
    name: 'get_extraction_results',
    displayName: 'Get Extraction Results',
    description: 'Fetches the data extracted from a specific batch of documents.',
    props: {
        extractionId: Property.ShortText({
            displayName: 'Extraction ID',
            description: 'Paste the ID of the extraction process.',
            required: true,
        }),
        batchId: requiredBatchIdDropdown,
        fileId: fileIdDropdown,
        timeout: Property.Number({
            displayName: 'Timeout (Seconds)',
            description: 'The maximum time to wait for the extraction to complete. Defaults to 120 seconds.',
            required: false,
        }),
    },
    async run(context) {
        const { extractionId, batchId, fileId, timeout } = context.propsValue;
        const { auth } = context;

        const POLLING_INTERVAL_MS = 2000;
        const maxAttempts = (timeout || 120) * 1000 / POLLING_INTERVAL_MS;
        let attempts = 0;

        const payload: Record<string, unknown> = {
            extractionId,
            batchId,
        };
        if (fileId) {
            payload['fileId'] = fileId;
        }

        while (attempts < maxAttempts) {
            const response = await httpClient.sendRequest<{
                status?: string;
                files?: unknown[];
                error?: string;
            }>({
                method: HttpMethod.POST,
                url: `${API_URL}/getBatchResults`,
                headers: {
                    'Authorization': `Bearer ${auth}`,
                    'Content-Type': 'application/json',
                },
                body: payload,
            });

            if (response.body.error) {
                throw new Error(`API Error: ${response.body.error}`);
            }

            if (response.body.files) {
                return response.body;
            }

            if (response.body.status !== 'waiting') {
                return response.body;
            }

            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
            attempts++;
        }

        throw new Error(`Extraction timed out after ${timeout || 120} seconds.`);
    },
});