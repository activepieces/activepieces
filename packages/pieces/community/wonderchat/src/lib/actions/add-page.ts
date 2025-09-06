import { createAction, Property } from '@activepieces/pieces-framework';

interface AddPagesRequest {
  apiKey: string;
  chatbotId: string;
  urls: string[];
  sessionCookie?: string;
}

export const addPage = createAction({
  name: 'add_page',
  displayName: 'Add Pages',
  description: 'Add new pages to your chatbot\'s knowledge base',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Wonderchat API key',
      required: true,
    }),
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'The ID of the chatbot to add pages to',
      required: true,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'List of URLs to add to your chatbot',
      required: true,
    }),
    sessionCookie: Property.ShortText({
      displayName: 'Session Cookie',
      description: 'Session cookie for crawling sites behind login (optional)',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const { apiKey, chatbotId, urls, sessionCookie } = propsValue;

    // Validate URLs array
    if (!urls || urls.length === 0) {
      throw new Error('At least one URL is required');
    }

    // Cast URLs to string array and validate each URL
    const urlStrings = urls as string[];
    if (!urlStrings.every(url => typeof url === 'string')) {
      throw new Error('All URLs must be strings');
    }

    // Prepare request body
    const requestBody: AddPagesRequest = {
      apiKey,
      chatbotId,
      urls: urlStrings,
    };

    // Add session cookie if provided
    if (sessionCookie) {
      requestBody.sessionCookie = sessionCookie;
    }

    try {
      const response = await fetch('https://app.wonderchat.io/api/v1/add-pages', {
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
        throw new Error(`Failed to add pages: ${error.message}`);
      }
      throw new Error('Failed to add pages: Unknown error occurred');
    }
  },
});
