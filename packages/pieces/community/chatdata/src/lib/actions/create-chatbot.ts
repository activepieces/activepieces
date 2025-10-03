import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const createChatbot = createAction({
  auth: ChatDataAuth,
  name: 'createChatbot',
  displayName: 'Create Chatbot',
  description: 'Create a chatbot in Chat Data',
  props: {
    chatbotName: Property.ShortText({
      displayName: "Chatbot Name",
      description: "The name for your chatbot",
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Select the underlying model type",
      required: false,
      options: {
        options: [
          { value: "custom-data-upload", label: "Custom Data Upload" },
          { value: "medical-chat-human", label: "Medical Chat (Human)" },
          { value: "medical-chat-vet", label: "Medical Chat (Veterinarian)" },
          { value: "custom-model", label: "Custom Model (Backend)" },
        ]
      }
    }),
    sourceText: Property.LongText({
      displayName: "Source Text",
      description: "Plain text content to train chatbot (used with custom-data-upload model)",
      required: false,
    }),
    urlsToScrape: Property.Array({
      displayName: "URLs to Scrape",
      description: "List of URLs to fetch text from",
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: "URL",
          required: true,
        }),
      },
    }),
    customBackend: Property.ShortText({
      displayName: "Custom Backend URL",
      description: "Your own backend URL (used when model = custom-model)",
      required: false,
    }),
    bearer: Property.ShortText({
      displayName: "Backend Bearer Token",
      description: "Bearer token for your custom backend (if required)",
      required: false,
    }),
    products: Property.Array({
      displayName: "Products (for training)",
      description: "Array of product objects for training",
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: "Product ID",
          required: true,
        }),
        name: Property.ShortText({
          displayName: "Product Name",
          required: true,
        }),
        color: Property.ShortText({
          displayName: "Color",
          required: false,
        }),
      },
    }),
    qAndAs: Property.Array({
      displayName: "Q & A Pairs",
      description: "Array of Q&A objects for training",
      required: false,
      properties: {
        question: Property.ShortText({
          displayName: "Question",
          required: true,
        }),
        answer: Property.LongText({
          displayName: "Answer",
          required: true,
        }),
      },
    }),
  },

  async run(context) {
    const {
      chatbotName, model, sourceText, urlsToScrape, customBackend, bearer, products, qAndAs
    } = context.propsValue;

    const bodyPayload: any = {
      chatbotName,
    };

    if (model) {
      bodyPayload.model = model;
    }
    if (sourceText) {
      bodyPayload.sourceText = sourceText;
    }
    if (urlsToScrape) {
      bodyPayload.urlsToScrape = urlsToScrape;
    }
    if (customBackend) {
      bodyPayload.customBackend = customBackend;
    }
    if (bearer) {
      bodyPayload.bearer = bearer;
    }
    if (products) {
      bodyPayload.products = products;
    }
    if (qAndAs) {
      bodyPayload.qAndAs = qAndAs;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      "/create-chatbot",
      bodyPayload
    );

    if (response.status !== "success") {
      throw new Error(`Chat Data API returned error: ${response.message || JSON.stringify(response)}`);
    }

    return response;
  }
});