import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const uploadUrl = createAction({
  auth:personalAiAuth,
  name: 'upload_url',
  displayName: 'Upload URL Content',
  description: 'Upload content from a URL to AI assistant.',
  // category: 'Documents',
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL of the content to upload',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title for the uploaded content',
      required: true,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma delimited list of tags for the content',
      required: false,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'Name of the source or application',
      required: false,
    }),
    createdTime: Property.ShortText({
      displayName: 'Created Time',
      description: 'Time (including timezone) of the content creation (e.g., Wed, 19 Sep 2023 13:31:00 PDT)',
      required: false,
    }),
    isStack: Property.Checkbox({
      displayName: 'Add to Memory',
      description: 'Flag to also add the content to memory',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { url, title, domainName, tags, sourceName, createdTime, isStack } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/upload-url`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        Url: url,
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
