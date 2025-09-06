import { createAction, Property } from '@activepieces/pieces-framework';

interface ChatRequest {
  chatbotId: string;
  question: string;
  chatlogId?: string;
  context?: string;
  contextUrl?: string;
}

interface ChatSource {
  url: string;
  title: string;
}

interface ChatResponse {
  response: string;
  chatlogId: string;
  sources: ChatSource[];
}

export const askQuestion = createAction({
  name: 'ask_question',
  displayName: 'Ask Question',
  description: 'Send a question to your Wonderchat bot and receive a response',
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot ID',
      description: 'The ID of the chatbot you want to chat with',
      required: true,
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question you wish to ask your chatbot',
      required: true,
    }),
    chatlogId: Property.ShortText({
      displayName: 'Chat Log ID',
      description: 'The ID of your current chat session for conversation continuity (optional)',
      required: false,
    }),
    context: Property.LongText({
      displayName: 'Context',
      description: 'Additional custom context about the chat session (e.g., user information)',
      required: false,
    }),
    contextUrl: Property.ShortText({
      displayName: 'Context URL',
      description: 'URL of the page the user is on to provide additional context',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const { chatbotId, question, chatlogId, context, contextUrl } = propsValue;

    // Validate required fields
    if (!chatbotId || !question) {
      throw new Error('Chatbot ID and question are required');
    }

    // Prepare request body
    const requestBody: ChatRequest = {
      chatbotId,
      question,
    };

    // Add optional parameters if provided
    if (chatlogId) {
      requestBody.chatlogId = chatlogId;
    }
    if (context) {
      requestBody.context = context;
    }
    if (contextUrl) {
      requestBody.contextUrl = contextUrl;
    }

    try {
      const response = await fetch('https://app.wonderchat.io/api/v1/chat', {
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

      const result: ChatResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to ask question: ${error.message}`);
      }
      throw new Error('Failed to ask question: Unknown error occurred');
    }
  },
});
