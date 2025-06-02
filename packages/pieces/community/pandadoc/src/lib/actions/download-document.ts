import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

export const downloadDocument = createAction({
  auth: pandadocAuth,
  name: 'downloadDocument',
  displayName: 'Download Document',
  description: 'Download a document as a PDF by its ID',
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The UUID of the document to download',
      required: true,
    }),
  },
  async run(context) {
    const { documentId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pandadoc.com/public/v1/documents/${documentId}/download`,
      headers: {
        'Authorization': `API-Key ${context.auth.apiKey}`,
      },
      responseType: 'arraybuffer', // To handle binary PDF data
    });

    // Return the PDF as a base64 string for easy handling in downstream steps
    return {
      fileName: `${documentId}.pdf`,
      fileData: Buffer.from(response.body).toString('base64'),
      contentType: (response.headers && response.headers['content-type']) || 'application/pdf',
    };
  },
});
