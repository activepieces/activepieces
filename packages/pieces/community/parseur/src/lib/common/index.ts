import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import {
  CreateDocumentFromFileParams,
  CreateDocumentFromFileResponse,
  CreateDocumentParams,
  CreateDocumentResponse,
  CreateWebhookParams,
  CreateWebhookResponse,
  DeleteWebhookParams,
  EnableWebhookParams,
  GetParsedDocumentByIdParams,
  GetParsedDocumentByIdResponse,
  ListDocumentsParams,
  ListDocumentsResponse,
  ListMailboxesParams,
  ListMailboxesResponse,
  ReprocessDocumentParams,
  ReprocessDocumentResponse,
} from './types';

export const parseurAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create a new API key in Account → API keys in the Parseur app: https://app.parseur.com/account/api-keys',
  required: true,
});

export const parseurCommon = {
  baseUrl: 'https://api.parseur.com',
  endpoints: {
    listDocuments: (parserId: number) => `/parser/${parserId}/document_set`,
    getParsedDocumentById: (documentId: string) => `/document/${documentId}`,
    createDocument: '/email',
    createDocumentFromFile: (parserId: number) => `/parser/${parserId}/upload`,
    reprocessDocument: (documentId: string) =>
      `/document/${documentId}/process`,
    listMailboxes: '/parser',
    createWebhook: '/webhook',
    enableWebhook: (webhookId: number, mailboxId: number) =>
      `/parser/${mailboxId}/webhook_set/${webhookId}`,
    deleteWebhook: (webhookId: number) => `/webhook/${webhookId}`,
  },
  getHeaders: (apiKey: string) => {
    return {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    };
  },
  // API methods
  listDocuments: async ({
    apiKey,
    parserId,
    ...queryParams
  }: ListDocumentsParams) => {
    const { page, page_size, with_result, ...rest } = queryParams;
    const parsedQuery = {
      ...(page != undefined ? { page: String(page) } : {}),
      ...(page_size != undefined ? { page_size: String(page_size) } : {}),
      ...(with_result != undefined ? { with_result: String(with_result) } : {}),
      ...rest,
    };
    const response = await httpClient.sendRequest<ListDocumentsResponse>({
      method: HttpMethod.GET,
      url:
        parseurCommon.baseUrl + parseurCommon.endpoints.listDocuments(parserId),
      headers: parseurCommon.getHeaders(apiKey),
      queryParams: parsedQuery,
    });
    return response.body;
  },
  getDocument: async ({ apiKey, documentId }: GetParsedDocumentByIdParams) => {
    const response =
      await httpClient.sendRequest<GetParsedDocumentByIdResponse>({
        method: HttpMethod.GET,
        url:
          parseurCommon.baseUrl +
          parseurCommon.endpoints.getParsedDocumentById(documentId),
        headers: parseurCommon.getHeaders(apiKey),
      });
    return response.body;
  },
  createDocument: async ({
    apiKey,
    ...documentParams
  }: CreateDocumentParams) => {
    const response = await httpClient.sendRequest<CreateDocumentResponse>({
      method: HttpMethod.POST,
      url: parseurCommon.baseUrl + parseurCommon.endpoints.createDocument,
      headers: parseurCommon.getHeaders(apiKey),
      body: documentParams,
    });
    return response.body;
  },
  createDocumentFromFile: async ({
    apiKey,
    file,
    parserId,
  }: CreateDocumentFromFileParams) => {
    const data = new FormData();
    const uint8 = new Uint8Array(file.data);
    data.append('file', new Blob([uint8]), file.filename);
    data.append('parserId', String(parserId));
    const response =
      await httpClient.sendRequest<CreateDocumentFromFileResponse>({
        method: HttpMethod.POST,
        url:
          parseurCommon.baseUrl +
          parseurCommon.endpoints.createDocumentFromFile(parserId),
        headers: {
          ...parseurCommon.getHeaders(apiKey),
          'Content-Type': 'multipart/form-data',
        },
        body: data,
      });
    return response.body;
  },
  reprocessDocument: async ({
    apiKey,
    documentId,
  }: ReprocessDocumentParams) => {
    const response = await httpClient.sendRequest<ReprocessDocumentResponse>({
      method: HttpMethod.POST,
      url:
        parseurCommon.baseUrl +
        parseurCommon.endpoints.reprocessDocument(documentId),
      headers: parseurCommon.getHeaders(apiKey),
    });
    return response.body;
  },
  listMailboxes: async ({ apiKey, ...queryParams }: ListMailboxesParams) => {
    const { page, page_size, ...rest } = queryParams;
    const parsedQuery = {
      ...(page != undefined ? { page: String(page) } : {}),
      ...(page_size != undefined ? { page_size: String(page_size) } : {}),
      ...rest,
    };
    const response = await httpClient.sendRequest<ListMailboxesResponse>({
      method: HttpMethod.GET,
      url: parseurCommon.baseUrl + parseurCommon.endpoints.listMailboxes,
      headers: parseurCommon.getHeaders(apiKey),
      queryParams: parsedQuery,
    });
    return response.body;
  },
  createWebhook: async ({ apiKey, ...webhookParams }: CreateWebhookParams) => {
    const reponse = await httpClient.sendRequest<CreateWebhookResponse>({
      method: HttpMethod.POST,
      url: parseurCommon.baseUrl + parseurCommon.endpoints.createWebhook,
      headers: parseurCommon.getHeaders(apiKey),
      body: webhookParams,
    });
    return reponse.body;
  },
  enableWebhook: async ({
    apiKey,
    webhookId,
    mailboxId,
  }: EnableWebhookParams) => {
    const response = await httpClient.sendRequest<void>({
      method: HttpMethod.POST,
      url:
        parseurCommon.baseUrl +
        parseurCommon.endpoints.enableWebhook(webhookId, mailboxId),
      headers: parseurCommon.getHeaders(apiKey),
    });
    if (response.status === 200 || response.status === 204) {
      return { success: true };
    } else {
      return { success: false };
    }
  },
  deleteWebhook: async ({ apiKey, webhookId }: DeleteWebhookParams) => {
    const response = await httpClient.sendRequest<void>({
      method: HttpMethod.DELETE,
      url:
        parseurCommon.baseUrl +
        parseurCommon.endpoints.deleteWebhook(webhookId),
      headers: parseurCommon.getHeaders(apiKey),
    });
    if (response.status === 200 || response.status === 204) {
      return { success: true };
    } else {
      return { success: false };
    }
  },
};

// Common Properties
