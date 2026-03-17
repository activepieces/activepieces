import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  ListKnowledgeItemsResponse,
  AddFaqItemParams,
  CreateFaqParams,
  Chatbot,
  ListChatbotsResponse,
  CreateReplyParams,
} from './types';

export const API_BASE_URL = 'https://api.aidbase.ai/v1';

function getHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function addVideo(apiKey: string, videoUrl: string) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/knowledge/video`,
    headers: getHeaders(apiKey),
    body: {
      video_url: videoUrl,
      video_type: 'YOUTUBE', // This is hardcoded as per the API documentation
    },
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(response.body.message || 'Failed to add video to Aidbase.');
  }
}

async function addWebsite(apiKey: string, websiteUrl: string) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/knowledge/website`,
    headers: getHeaders(apiKey),
    body: {
      website_url: websiteUrl,
    },
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to add website to Aidbase.'
    );
  }
}

async function listKnowledgeItems(
  apiKey: string
): Promise<ListKnowledgeItemsResponse> {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: ListKnowledgeItemsResponse;
    message?: string;
  }>({
    method: HttpMethod.GET,
    url: `${API_BASE_URL}/knowledge`,
    headers: getHeaders(apiKey),
  });

  if (response.body.success && response.body.data) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to list knowledge items from Aidbase.'
    );
  }
}

async function addFaqItem(
  apiKey: string,
  faqId: string,
  params: AddFaqItemParams
) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/knowledge/${faqId}/faq-item`,
    headers: getHeaders(apiKey),
    body: params,
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to add FAQ item to Aidbase.'
    );
  }
}

async function createFaq(apiKey: string, params: CreateFaqParams) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/knowledge/faq`,
    headers: getHeaders(apiKey),
    body: params,
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to create FAQ in Aidbase.'
    );
  }
}

async function listChatbots(apiKey: string): Promise<ListChatbotsResponse> {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: { items: Chatbot[] };
    message?: string;
  }>({
    method: HttpMethod.GET,
    url: `${API_BASE_URL}/chatbots`,
    headers: getHeaders(apiKey),
  });

  if (response.body.success && response.body.data?.items) {
    return { items: response.body.data.items };
  } else {
    throw new Error(
      response.body.message || 'Failed to list chatbots from Aidbase.'
    );
  }
}

async function createChatbotReply(
  apiKey: string,
  chatbotId: string,
  params: CreateReplyParams
) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.POST,
    url: `${API_BASE_URL}/chatbot/${chatbotId}/reply`,
    headers: getHeaders(apiKey),
    body: params,
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to create chatbot reply in Aidbase.'
    );
  }
}

async function startTraining(apiKey: string, knowledgeId: string) {
  const response = await httpClient.sendRequest<{
    success: boolean;
    data?: unknown;
    message?: string;
  }>({
    method: HttpMethod.PUT, 
    url: `${API_BASE_URL}/knowledge/${knowledgeId}/train`,
    headers: getHeaders(apiKey),
  });

  if (response.body.success) {
    return response.body.data;
  } else {
    throw new Error(
      response.body.message || 'Failed to start training in Aidbase.'
    );
  }
}

export const aidbaseClient = {
  addVideo,
  addWebsite,
  listKnowledgeItems,
  addFaqItem,
  createFaq,
  listChatbots,
  createChatbotReply,
  startTraining,
};