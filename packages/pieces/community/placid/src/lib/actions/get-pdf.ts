import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const getPdfAction = createAction({
  name: 'get-pdf',
  auth: placidAuth,
  displayName: 'Get PDF',
  description: 'Retrieve a previously generated PDF by its ID.',
  props: {
    pdfId: Property.ShortText({
      displayName: 'PDF ID',
      description:
        'The ID of the PDF to retrieve (returned from the Create PDF API).',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { pdfId } = propsValue;

    try {
      const response = await placidApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: `/pdfs/${pdfId}`,
      });

      return {
        success: true,
        message: 'PDF retrieved successfully',
        response,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          throw new Error(
            'Unauthorized: Invalid API key. Please check your credentials.'
          );
        case 404:
          throw new Error('PDF not found: Please verify the PDF ID.');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(
            `Placid API Error (${status || 'Unknown'}): ${message}`
          );
      }
    }
  },
});
