import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const createMemory = createAction({
  auth:personalAiAuth,
  name: 'create_memory',
  displayName: 'Create Memory',
  description: 'Upload memories to your AI assistant stack.',
  // category: 'Memory',
  props: {
    text: Property.LongText({
      displayName: 'Memory Text',
      description: 'Plain text memories to upload to your stack',
      required: true,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'The source or application of memory to help you recall where it is from',
      required: true,
    }),
    createdTime: Property.ShortText({
      displayName: 'Created Time',
      description: 'Time (including timezone) of the memory (e.g., Wed, 19 Sep 2023 13:31:00 PDT)',
      required: false,
    }),
    rawFeedText: Property.LongText({
      displayName: 'Raw Feed Text',
      description: 'The formatted text that can be stored as it is',
      required: false,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI persona',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma delimited list of tags for the memory',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { text, sourceName, createdTime, rawFeedText, domainName, tags } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/v1/memory`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        Text: text,
        SourceName: sourceName,
        ...(createdTime && { CreatedTime: createdTime }),
        ...(rawFeedText && { RawFeedText: rawFeedText }),
        ...(domainName && { DomainName: domainName }),
        ...(tags && { Tags: tags }),
      },
    });

    return response.body;
  },
});
