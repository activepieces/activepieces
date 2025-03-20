import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const updateDocument = createAction({
  auth:personalAiAuth,
  name: 'update_document',
  displayName: 'Update Document',
  description: 'Update an existing document in AI assistant.',
  // category: 'Documents',
  props: {
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The unique identifier of the document to update',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Document Text',
      description: 'The updated text content of the document',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Document Title',
      description: 'Updated title of the document',
      required: false,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma delimited list of tags for the document',
      required: false,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'Name of the source or application',
      required: false,
    }),
    createdTime: Property.ShortText({
      displayName: 'Created Time',
      description: 'Time (including timezone) of the document creation (e.g., Wed, 19 Sep 2023 13:31:00 PDT)',
      required: false,
    }),
    isStack: Property.Checkbox({
      displayName: 'Add to Memory',
      description: 'Flag to also add the document to memory',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { documentId, text, title, domainName, tags, sourceName, createdTime, isStack } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/update-document`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        DocumentId: documentId,
        Text: text,
        ...(title && { Title: title }),
        ...(domainName && { DomainName: domainName }),
        ...(tags && { Tags: tags }),
        ...(sourceName && { SourceName: sourceName }),
        ...(createdTime && { CreatedTime: createdTime }),
        ...(isStack !== undefined && { is_stack: isStack }),
      },
    });

    return response.body;
  },
});
