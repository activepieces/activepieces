import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { personalAiAuth } from '../../auth';
import { BASE_URL } from '../../../index';

export const getDocument = createAction({
  auth:personalAiAuth,
  name: 'get_document',
  displayName: 'Get Document',
  description: 'Retrieve a document from AI assistant.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single Personal AI document by its document ID, optionally including the full content. Use when you need to read back a previously uploaded document. The document ID is required; this is a read-only lookup and is idempotent.', idempotent: true },
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
        'x-api-key': auth.secret_text,
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
