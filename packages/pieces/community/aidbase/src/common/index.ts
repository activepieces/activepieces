import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AddFaqItemParams,
  AddVideoParams,
  AddVideoResponse,
  AddWebsiteParams,
  AddWebsiteResponse,
  CreateChatbotReplyParams,
  CreateFaqParams,
  CreateFaqResponse,
  ListChatBotsResponse,
  ListKnowledgeItemsParams,
  ListKnowledgeItemsResponse,
  StartTrainingParams,
  StartTrainingResponse,
} from './types';
export const aidbaseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Aidbase API Key',
  required: true,
});

export const aidbaseCommon = {
  // Base API Data
  baseUrl: 'https://api.aidbase.ai/v1',
  endpoints: {
    listKnowledgeItems: '/knowledge',
    listChatbots: '/chatbots',
    addVideo: '/knowledge/video',
    createFaq: '/knowledge/faq',
    startTraining: (id: string) => `/knowledge/${id}/train`,
    addFaqItem: (id: string) => `/knowledge/${id}/faq-item`,
    addWebsite: '/knowledge/website',
    createChatbotReply: (id: string) => `/chatbot/${id}/reply`,
  },
  getHeaders: (apiKey: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }),

  // Methods
  listKnowledgeItems: async ({
    apiKey,
    ...queryParams
  }: ListKnowledgeItemsParams) => {
    const response = await httpClient.sendRequest<ListKnowledgeItemsResponse>({
      method: HttpMethod.GET,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.listKnowledgeItems}`,
      headers: aidbaseCommon.getHeaders(apiKey),
      queryParams: {
        ...(queryParams.cursor ? { cursor: queryParams.cursor } : {}),
        ...(queryParams.limit ? { limit: String(queryParams.limit) } : {}),
      },
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(
        response.body.message || 'Failed to list knowledge items'
      );
    }
  },
  listChatBots: async (apiKey: string) => {
    const response = await httpClient.sendRequest<ListChatBotsResponse>({
      method: HttpMethod.GET,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.listChatbots}`,
      headers: aidbaseCommon.getHeaders(apiKey),
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to list chatbots');
    }
  },
  addVideo: async ({ apiKey, ...videoParams }: AddVideoParams) => {
    const response = await httpClient.sendRequest<AddVideoResponse>({
      method: HttpMethod.POST,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.addVideo}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: videoParams,
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to add video');
    }
  },
  createFaq: async ({ apiKey, title, description }: CreateFaqParams) => {
    const response = await httpClient.sendRequest<CreateFaqResponse>({
      method: HttpMethod.POST,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.createFaq}`,
      headers: aidbaseCommon.getHeaders(apiKey),
      body: {
        title,
        description,
      },
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to create FAQ');
    }
  },
  startTraining: async ({ apiKey, id }: StartTrainingParams) => {
    const response = await httpClient.sendRequest<StartTrainingResponse>({
      method: HttpMethod.PUT,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.startTraining(
        id
      )}`,
      headers: aidbaseCommon.getHeaders(apiKey),
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to start training');
    }
  },
  addFaqItem: async ({ apiKey, faq_id, ...itemData }: AddFaqItemParams) => {
    const response = await httpClient.sendRequest<CreateFaqResponse>({
      method: HttpMethod.POST,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.addFaqItem(
        faq_id
      )}`,
      headers: aidbaseCommon.getHeaders(apiKey),
      body: {
        ...itemData,
      },
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to add FAQ item');
    }
  },
  addWebsite: async ({ apiKey, website_url }: AddWebsiteParams) => {
    const response = await httpClient.sendRequest<AddWebsiteResponse>({
      method: HttpMethod.POST,
      url: `${aidbaseCommon.baseUrl}${aidbaseCommon.endpoints.addWebsite}`,
      headers: aidbaseCommon.getHeaders(apiKey),
      body: {
        website_url,
      },
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(response.body.message || 'Failed to add website');
    }
  },
  createChatbotReply: async ({
    apiKey,
    chatbot_id,
    ...replyParams
  }: CreateChatbotReplyParams) => {
    const response = await httpClient.sendRequest<CreateFaqResponse>({
      method: HttpMethod.POST,
      url: `${
        aidbaseCommon.baseUrl
      }${aidbaseCommon.endpoints.createChatbotReply(chatbot_id)}`,
      headers: aidbaseCommon.getHeaders(apiKey),
      body: {
        ...replyParams,
      },
    });
    if (response.body.success) {
      return response.body.data;
    } else {
      throw new Error(
        response.body.message || 'Failed to create chatbot reply'
      );
    }
  },
};
