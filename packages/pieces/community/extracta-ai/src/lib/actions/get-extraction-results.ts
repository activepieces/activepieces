import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

interface GetResultsBody {
  extractionId: string;
  batchId: string;
  fileId?: string;
}

export const getExtractionResults = createAction({
  auth: extractaAiAuth,
  name: 'get_extraction_results',
  displayName: 'Get Extraction Results',
  description: 'Fetches successful data from extraction. Note: The API recommends a 2-second delay between requests to avoid rate-limiting.',
  props: {
    extractionId: Property.ShortText({
      displayName: 'Extraction ID',
      description: 'The ID of the extraction',
      required: true,
    }),
    batchId: Property.ShortText({
      displayName: 'Batch ID',
      description: 'The ID of the batch',
      required: true,
    }),
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file (optional). If provided, filters results to only that file.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;

    const requestBody: GetResultsBody = {
      extractionId: context.propsValue.extractionId,
      batchId: context.propsValue.batchId,
    };

    if (context.propsValue.fileId) {
      requestBody.fileId = context.propsValue.fileId;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/getBatchResults',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const body = error.response.body;

        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your API key.');
          case 403:
            throw new Error(
              'Access denied. Your API key may not have permission for this operation.'
            );
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 400:
            throw new Error(
              `Invalid request: ${body.message || JSON.stringify(body)}`
            );
          default:
            throw new Error(
              `API error (${status}): ${body.message || 'Unknown error'}`
            );
        }
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  },
});
