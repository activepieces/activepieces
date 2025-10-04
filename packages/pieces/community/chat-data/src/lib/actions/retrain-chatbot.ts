import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';
import { chatbotIdProperty } from '../properties';

export const retrainChatbot = createAction({
  auth: chatDataAuth,
  name: 'retrain_chatbot',
  displayName: 'Retrain a Chatbot',
  description:
    'Retrain an existing chatbot with new data sources or remove existing knowledge chunks',
  props: {
    chatbotId: chatbotIdProperty,
    sourceText: Property.LongText({
      displayName: 'Source Text',
      description:
        'Text data for chatbot training (subject to character limits based on your plan)',
      required: false
    }),
    urlsToScrape: Property.Array({
      displayName: 'URLs to Scrape',
      description:
        'List of URLs for content extraction (must start with http:// or https://)',
      required: false
    }),
    extractMainContent: Property.Checkbox({
      displayName: 'Extract Main Content',
      description: 'Extract only the main content from web pages',
      required: false,
      defaultValue: true
    }),
    cookies: Property.ShortText({
      displayName: 'Cookies',
      description: 'Cookies to use when scraping websites',
      required: false
    }),
    includeOnlyTags: Property.ShortText({
      displayName: 'Include Only Tags',
      description: 'HTML tags to include when scraping (comma-separated)',
      required: false
    }),
    excludeTags: Property.ShortText({
      displayName: 'Exclude Tags',
      description: 'HTML tags to exclude when scraping (comma-separated)',
      required: false
    }),
    products: Property.Json({
      displayName: 'Products',
      description:
        'JSON array of products for training. Format: [{"id": "product_123", "information": {"name": "Product Name", "description": "Description"}}]',
      required: false
    }),
    qAndAs: Property.Json({
      displayName: 'Q&As',
      description:
        'JSON array of Q&A pairs. Format: [{"question": "What is...?", "answer": "The answer is..."}]',
      required: false
    }),
    deleteWebsites: Property.Array({
      displayName: 'Delete Website URLs',
      description:
        "URLs of websites to remove from the chatbot's knowledge base",
      required: false
    }),
    deleteTexts: Property.Array({
      displayName: 'Delete Text IDs',
      description:
        "IDs of text sources to remove from the chatbot's knowledge base",
      required: false
    }),
    deleteProducts: Property.Array({
      displayName: 'Delete Product IDs',
      description:
        "IDs of products to remove from the chatbot's knowledge base",
      required: false
    }),
    deleteQAndAs: Property.Array({
      displayName: 'Delete Q&A IDs',
      description:
        "IDs of Q&A pairs to remove from the chatbot's knowledge base",
      required: false
    }),
    deleteFiles: Property.Array({
      displayName: 'Delete File IDs',
      description: "IDs of files to remove from the chatbot's knowledge base",
      required: false
    })
  },
  async run(context) {
    const {
      chatbotId,
      sourceText,
      urlsToScrape,
      extractMainContent,
      cookies,
      includeOnlyTags,
      excludeTags,
      products,
      qAndAs,
      deleteWebsites,
      deleteTexts,
      deleteProducts,
      deleteQAndAs,
      deleteFiles
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      chatbotId
    };

    // Add training data if provided
    if (sourceText) {
      requestBody.sourceText = sourceText;
    }

    if (urlsToScrape && urlsToScrape.length > 0) {
      requestBody.urlsToScrape = urlsToScrape as string[];

      // Add scraping options
      requestBody.options = {
        ...(extractMainContent !== undefined && { extractMainContent }),
        ...(cookies && { Cookies: cookies }),
        ...(includeOnlyTags && { includeOnlyTags }),
        ...(excludeTags && { excludeTags })
      };
    }

    if (products) {
      try {
        requestBody.products = typeof products === 'string' ? JSON.parse(products) : products;
      } catch (error) {
        throw new Error('Invalid JSON format for products. Please provide a valid JSON array.');
      }
    }

    if (qAndAs) {
      try {
        requestBody.qAndAs = typeof qAndAs === 'string' ? JSON.parse(qAndAs) : qAndAs;
      } catch (error) {
        throw new Error('Invalid JSON format for Q&As. Please provide a valid JSON array.');
      }
    }

    // Build deletes array
    const deletes: any[] = [];

    if (deleteWebsites && deleteWebsites.length > 0) {
      (deleteWebsites as string[]).forEach((url) => {
        deletes.push({ type: 'website', url });
      });
    }

    if (deleteTexts && deleteTexts.length > 0) {
      (deleteTexts as string[]).forEach((id) => {
        deletes.push({ type: 'text', id });
      });
    }

    if (deleteProducts && deleteProducts.length > 0) {
      (deleteProducts as string[]).forEach((id) => {
        deletes.push({ type: 'product', id });
      });
    }

    if (deleteQAndAs && deleteQAndAs.length > 0) {
      (deleteQAndAs as string[]).forEach((id) => {
        deletes.push({ type: 'qAndA', id });
      });
    }

    if (deleteFiles && deleteFiles.length > 0) {
      (deleteFiles as string[]).forEach((id) => {
        deletes.push({ type: 'file', id });
      });
    }

    if (deletes.length > 0) {
      requestBody.deletes = deletes;
    }

    const result = await chatDataCommon.makeRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/retrain-chatbot',
      body: requestBody
    });

    return result;
  }
});
