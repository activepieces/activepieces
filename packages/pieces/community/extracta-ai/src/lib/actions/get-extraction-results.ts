import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

export const getExtractionResults = createAction({
  auth: extractaAiAuth,
  name: 'get_extraction_results',
  displayName: 'Get Extraction Results',
  description: 'Fetches successful data from extraction',
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
    const apiKey = context.auth;

    const requestBody: any = {
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
        throw new Error(
          `Failed to get extraction results: ${error.response.status} - ${JSON.stringify(
            error.response.body
          )}`
        );
      }
      throw new Error(`Failed to get extraction results: ${error.message}`);
    }
  },
});
