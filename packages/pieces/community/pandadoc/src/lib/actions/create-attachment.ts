import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

export const createAttachment = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  auth: pandadocAuth,
  name: 'createAttachment',
  displayName: 'Create Attachment',
  description: 'Add an attachment to a document using a file URL',
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The UUID of the document to attach the file to',
      required: true,
    }),
    source: Property.ShortText({
      displayName: 'File URL',
      description: 'URL link to the file to be attached to the document',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional name to set for the uploaded file',
      required: false,
    }),
  },
  async run(context) {
    const { documentId, source, name } = context.propsValue;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.pandadoc.com/public/v1/documents/${documentId}/attachments`,
      headers: {
        'Authorization': `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        source,
        name,
      },
    });

    return response.body;
  },
});
