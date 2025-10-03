import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { chatbotIdDropdown } from '../common/dropdown';

export const retrainAChatbot = createAction({
  auth: ChatDataAuth,
  name: 'retrainAChatbot',
  displayName: 'Retrain a Chatbot',
  description: 'Retrain an existing chatbot (only works for `custom-data-upload` model).',
  props: {
    chatbotId: chatbotIdDropdown,
    sourceText: Property.LongText({
      displayName: "Source Text",
      description:
        "New text data to include in retraining (for custom-data-upload model)",
      required: false,
    }),

    urlsToScrape: Property.Array({
      displayName: "URLs to Scrape",
      description:
        "List of URLs whose content will be re-scraped/added for retraining",
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: "URL",
          required: true,
        }),
      },
    }),

    products: Property.Array({
      displayName: "Products",
      description:
        "Product data to include for retraining (if used originally)",
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: "Product ID",
          required: true,
        }),
        name: Property.ShortText({
          displayName: "Product Name",
          required: false,
        }),
        description: Property.LongText({
          displayName: "Product Description",
          required: false,
        }),
      },
    }),

    qAndAs: Property.Array({
      displayName: "Q & A Pairs",
      description: "Q&A pairs to add or update",
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

    deletes: Property.Array({
      displayName: "Deletes",
      description:
        "List of knowledge sources to remove (e.g. website URLs, product entries)",
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: "Type",
          required: true,
        }),
        url: Property.ShortText({
          displayName: "URL (if applicable)",
          required: false,
        }),
        id: Property.ShortText({
          displayName: "ID (if applicable)",
          required: false,
        }),
      },
    }),

    options: Property.Json({
      displayName: "Scraping / Extraction Options",
      description:
        "Customization for how websites are scraped (Cookies, includeOnlyTags, excludeTags, extractMainContent, etc.)",
      required: false,
    }),
  },

  async run(context) {
    const props = context.propsValue;

    const body: any = {
      chatbotId: props.chatbotId,
    };

    if (props.sourceText) {
      body.sourceText = props.sourceText;
    }
    if (props.urlsToScrape) {
      body.urlsToScrape = (props.urlsToScrape as { url: string }[]).map(
        (u) => u.url
      );
    }
    if (props.products) {
      body.products = props.products;
    }
    if (props.qAndAs) {
      body.qAndAs = props.qAndAs;
    }
    if (props.deletes) {
      body.deletes = props.deletes;
    }
    if (props.options) {
      body.options = props.options;
    }

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      "/retrain-chatbot",
      body
    );

    if (response.status && response.status !== "success") {
      throw new Error(
        `Retrain failed: ${JSON.stringify(response)}`
      );
    }

    return response;
  },
});