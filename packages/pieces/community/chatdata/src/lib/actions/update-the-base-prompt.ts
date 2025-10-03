import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown } from '../common/dropdown';

export const updateTheBasePrompt = createAction({
  auth: ChatDataAuth,
  name: 'updateTheBasePrompt',
  displayName: 'Update the Base Prompt',
  description: 'Update the base prompt (system instructions) of a Chat Data chatbot',
  props: {
    chatbotId: chatbotIdDropdown,
    basePrompt: Property.LongText({
      displayName: "Base Prompt",
      description:
        "The new base prompt / instructions for the chatbot (system behavior)",
      required: true,
    }),
    // Optional extra fields 
    chatbotName: Property.ShortText({
      displayName: "Chatbot Name (optional)",
      description: "Change the name of the chatbot (if needed)",
      required: false,
    }),
    initialMessages: Property.Array({
      displayName: "Initial Messages",
      description:
        "Optional messages to set as initial conversation lines for the chatbot",
      required: false,
      properties: {
        message: Property.ShortText({
          displayName: "Message",
          required: true,
        }),
      },
    }),
    visibility: Property.StaticDropdown({
      displayName: "Visibility",
      description:
        "Optional: set chatbot visibility (private / public)",
      required: false,
      options: {
        options: [
          { value: "private", label: "Private" },
          { value: "public", label: "Public" },
        ],
      },
    }),
    customBackend: Property.ShortText({
      displayName: "Custom Backend URL (optional)",
      description: "Override backend URL for custom-model usage",
      required: false,
    }),
    bearer: Property.ShortText({
      displayName: "Backend Bearer Token (optional)",
      description:
        "Bearer token for custom backend, if applicable",
      required: false,
    }),
  },

  async run(context) {
    const {
      chatbotId,
      basePrompt,
      chatbotName,
      initialMessages,
      visibility,
      customBackend,
      bearer,
    } = context.propsValue;

    const body: any = {
      chatbotId,
      basePrompt,
    };

    if (chatbotName) {
      body.chatbotName = chatbotName;
    }
    if (initialMessages) {
      body.initialMessages = (initialMessages as Array<{ message: string }>).map(
        (m) => m.message
      );
    }
    if (visibility) {
      body.visibility = visibility;
    }
    if (customBackend) {
      body.customBackend = customBackend;
    }
    if (bearer) {
      body.bearer = bearer;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      "/update-chatbot-settings",
      body
    );

    if (response.status !== "success") {
      throw new Error(
        `Failed to update base prompt: ${JSON.stringify(response)}`
      );
    }

    return response;
  },
});