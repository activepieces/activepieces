import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const getDocument = createAction({
  auth:personalAiAuth,
  name: 'get_document',
  displayName: 'Get Document',
  description: 'Retrieve a document from AI assistant.',
  // category: 'Documents',
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The unique identifier of the document to retrieve',
      required: true,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Flag to include the document content in the response',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue: { documentId, domainName, includeContent } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/get-document`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      queryParams: {
        DocumentId: documentId,
        ...(domainName && { DomainName: domainName }),
        ...(includeContent !== undefined && { IncludeContent: includeContent.toString() }),
      },
    });

    return response.body;
  },
});
