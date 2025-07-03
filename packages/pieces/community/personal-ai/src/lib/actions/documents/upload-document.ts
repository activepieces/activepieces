import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const uploadDocument = createAction({
  auth:personalAiAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description: 'Upload a text document to AI assistant.',
  // category: 'Documents',
  props: {
    text: Property.LongText({
      displayName: 'Document Text',
      description: 'The text content of the document to upload',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Document Title',
      description: 'Title of the document',
      required: true,
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
    const { auth, propsValue: { text, title, domainName, tags, sourceName, createdTime, isStack } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/v1/upload-text`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        Text: text,
        Title: title,
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
