import { createAction, Property } from '@activepieces/pieces-framework';

interface AddTagsRequest {
  apiKey: string;
  chatlogId: string;
  tags: string[];
}

export const addTag = createAction({
  name: 'add_tag',
  displayName: 'Add Tags to Chatlog',
  description: 'Add custom tags to a specific chatlog for better categorization and filtering',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Wonderchat API key',
      required: true,
    }),
    chatlogId: Property.ShortText({
      displayName: 'Chat Log ID',
      description: 'The ID of the chatlog to add tags to',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tag strings to add',
      required: true,
    }),
  },
  async run({ propsValue }) {
    const { apiKey, chatlogId, tags } = propsValue;

    // Validate required fields
    if (!apiKey || !chatlogId || !tags) {
      throw new Error('API key, chatlog ID, and tags are required');
    }

    // Validate tags array
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('At least one tag is required');
    }

    // Cast tags to string array and validate each tag
    const tagStrings = tags as string[];
    if (!tagStrings.every(tag => typeof tag === 'string' && tag.trim().length > 0)) {
      throw new Error('All tags must be non-empty strings');
    }

    // Prepare request body
    const requestBody: AddTagsRequest = {
      apiKey,
      chatlogId,
      tags: tagStrings,
    };

    try {
      const response = await fetch('https://app.wonderchat.io/api/v1/add-tags-to-chatlog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add tags: ${error.message}`);
      }
      throw new Error('Failed to add tags: Unknown error occurred');
    }
  },
});
