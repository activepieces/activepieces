import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const spCopilot = createAction({
  name: 'spCopilot',
  displayName: 'SecruityPal Copilot',
  description: 'An AI-powered assistant that helps craft answers for security, GRC, privacy, and product-related questions',
  props: {
    endpoint: Property.ShortText({
      displayName: 'Endpoint URL',
      description: 'SecurityPal Copilot endpoint URL',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'SecurityPal API Key for authentication',
      required: true,
    }),
    libraryId: Property.Number({
      displayName: 'Library ID',
      description: 'Library ID for the copilot request',
      required: true,
      defaultValue: 0,
    }),
    instruction: Property.LongText({
      displayName: 'Instruction',
      description: 'Instruction for the copilot',
      required: false,
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'Question to ask the copilot',
      required: true,
    }),
    tagIds: Property.Json({
      displayName: 'Tag IDs',
      description: 'Array of tag IDs to filter by',
      required: false,
    }),
    includeSources: Property.Checkbox({
      displayName: 'Include Sources',
      description: 'Whether to include sources in the response',
      required: false,
      defaultValue: false,
    }),
    includeLibrary: Property.Checkbox({
      displayName: 'Include Library',
      description: 'Whether to include library information in the response',
      required: false,
      defaultValue: false,
    }),
    includeTags: Property.Checkbox({
      displayName: 'Include Tags',
      description: 'Whether to include tags in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { 
      endpoint,
      apiKey,
      libraryId, 
      instruction, 
      question, 
      tagIds, 
      includeSources, 
      includeLibrary, 
      includeTags 
    } = context.propsValue;
    
    // Call SecurityPal AI Copilot
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        libraryId: libraryId || 0,
        instruction: instruction || '',
        tagIds: tagIds || [],
        includeSources: includeSources || false,
        includeLibrary: includeLibrary || false,
        includeTags: includeTags || false,
        question: question,
      },
    });

    return {
      success: true,
      status: 'copilot_response_received',
      data: response.body,
      question: question,
      instruction: instruction,
      libraryId: libraryId,
      timestamp: new Date().toISOString(),
    };
  },
});
