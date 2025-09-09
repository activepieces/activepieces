import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import * as properties from './properties';
import * as schemas from './schemas';
import {
  askQuestionRequestParams,
  Bot,
  createBotRequestParams,
  createSourceRequestParams,
  listBotsParams,
  PresignedUpdateUrlResponse,
  Team,
  createSourceUrlParams as teamAndBotUrlParams,
  uploadSourceFileRequestParams,
  uploadToCloudStorageParams,
} from './types';

export const docsbotAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'The API key for authenticating with DocsBot.',
});

export const docsbotCommon = {
  // API Info
  baseUrl: 'https://docsbot.ai/api',
  endpoints: {
    askQuestion: ({ teamId, botId }: teamAndBotUrlParams) =>
      `https://api.docsbot.ai/teams/${teamId}/bots/${botId}/chat-agent`,
    createSource: ({ teamId, botId }: teamAndBotUrlParams) =>
      `${docsbotCommon.baseUrl}/teams/${teamId}/bots/${botId}/sources`,
    createBot: (teamId: string) =>
      `${docsbotCommon.baseUrl}/teams/${teamId}/bots`,
    createPresignedFileUploadURL: ({ teamId, botId }: teamAndBotUrlParams) =>
      `${docsbotCommon.baseUrl}/teams/${teamId}/bots/${botId}/upload-url`,
    listTeams: () => `${docsbotCommon.baseUrl}/teams`,
    listBots: (teamId: string) =>
      `${docsbotCommon.baseUrl}/teams/${teamId}/bots`,
  },

  // Properties
  askQuestionProperties: properties.askQuestion,
  createSourceProperties: properties.createSource,
  uploadSourceFileProperties: properties.uploadSourceFile,
  createBotProperties: properties.createBot,
  findBotProperties: properties.findBot,

  // Schemas
  askQuestionSchema: schemas.askQuestion,
  createSourceSchema: schemas.createSource,
  uploadSourceFileSchema: schemas.uploadSourceFile,
  createBotSchema: schemas.createBot,
  findBotSchema: schemas.findBot,

  // Methods
  askQuestion: async ({
    apiKey,
    teamId,
    botId,
    ...chatParams
  }: askQuestionRequestParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: docsbotCommon.endpoints.askQuestion({ teamId, botId }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: { ...chatParams },
    });
    return response.body;
  },
  createSource: async ({
    apiKey,
    teamId,
    botId,
    ...sourceParams
  }: createSourceRequestParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: docsbotCommon.endpoints.createSource({
        teamId: teamId,
        botId: botId,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: { ...sourceParams },
    });
    return response.body;
  },
  createBot: async ({
    apiKey,
    teamId,
    ...botParams
  }: createBotRequestParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: docsbotCommon.endpoints.createBot(teamId),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: { ...botParams },
    });
    return response.body;
  },
  createPresignedFileUploadURL: async ({
    apiKey,
    teamId,
    botId,
    fileName,
  }: uploadSourceFileRequestParams) => {
    const response = await httpClient.sendRequest<PresignedUpdateUrlResponse>({
      method: HttpMethod.GET,
      url: docsbotCommon.endpoints.createPresignedFileUploadURL({
        teamId,
        botId,
      }) + `?fileName=${encodeURIComponent(fileName)}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.body;
  },
  uploadFileToCloudStorage: async ({
    uploadUrl,
    file,
  }: uploadToCloudStorageParams) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadUrl,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });
    return response.body;
  },
  listBots: async ({ apiKey, teamId }: listBotsParams) => {
    const resonse = await httpClient.sendRequest<Bot[]>({
      method: HttpMethod.GET,
      url: docsbotCommon.endpoints.listBots(teamId),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return resonse.body;
  },
  listTeams: async (apiKey: string) => {
    const response = await httpClient.sendRequest<Team[]>({
      method: HttpMethod.GET,
      url: docsbotCommon.endpoints.listTeams(),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.body;
  },
};
