import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';
import { documentDropdown } from '../common/utils';



export const getDocumentAttachments = createAction({
  auth: pandadocAuth,
  name: 'getDocumentAttachments',
  displayName: 'Get Document Attachments',
  description: 'Retrieve all attachments associated with a specific document',
  props: {
    documentId: documentDropdown,
  },
  async run(context) {
    const { documentId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pandadoc.com/public/v1/documents/${documentId}/attachments`,
      headers: {
        'Authorization': `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
