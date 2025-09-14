import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import {
  AnalyzeAudioParams,
  AnalyzeDocumentParams,
  AnalyzeImageParams,
  AnalyzeVideoParams,
  FileResponse,
  GetFileParams,
  PredictionResponse,
  UploadFileParams,
} from './types';
export const vlmRunAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your VLM Run API Key',
  required: true,
});

export const vlmRunCommon = {
  baseUrl: 'https://api.vlm.run/v1',
  baseHeaders: (apiKey: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }),
  endpoints: {
    uploadFile: '/files',
    listFiles: '/files',
    analyzeAudio: '/audio/generate',
    analyzeImage: '/image/generate',
    analyzeDocument: '/document/generate',
    analyzeVideo: '/video/generate',
    getFile: (fileId: string) => `/files/${fileId}`,
  },

  // Methods
  uploadFile: async ({ apiKey, file }: UploadFileParams) => {
    const formData = new FormData();
    formData.append('file', file.data, { filename: file.filename });

    const response = await httpClient.sendRequest<FileResponse>({
      method: HttpMethod.POST,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.uploadFile}`,
      headers: {
        ...vlmRunCommon.baseHeaders(apiKey),
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    return response.body;
  },
  listFiles: async (apiKey: string) => {
    const response = await httpClient.sendRequest<FileResponse[]>({
      method: HttpMethod.GET,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.listFiles}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
    });
    return response.body;
  },
  analyzeAudio: async ({ apiKey, ...params }: AnalyzeAudioParams) => {
    const response = await httpClient.sendRequest<PredictionResponse>({
      method: HttpMethod.POST,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeAudio}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
      body: {
        domain: 'audio.transcription',
        ...params,
      },
    });
    return response.body;
  },
  analyzeImage: async ({ apiKey, ...params }: AnalyzeImageParams) => {
    const response = await httpClient.sendRequest<PredictionResponse>({
      method: HttpMethod.POST,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeImage}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
      body: params,
    });
    return response.body;
  },
  analyzeDocument: async ({ apiKey, ...params }: AnalyzeDocumentParams) => {
    const response = await httpClient.sendRequest<PredictionResponse>({
      method: HttpMethod.POST,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeDocument}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
      body: params,
    });
    return response.body;
  },
  analyzeVideo: async ({ apiKey, ...params }: AnalyzeVideoParams) => {
    const response = await httpClient.sendRequest<PredictionResponse>({
      method: HttpMethod.POST,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.analyzeVideo}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
      body: params,
    });
    return response.body;
  },
  getFile: async ({ apiKey, file_id }: GetFileParams) => {
    const response = await httpClient.sendRequest<FileResponse>({
      method: HttpMethod.GET,
      url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.getFile(file_id)}`,
      headers: vlmRunCommon.baseHeaders(apiKey),
    });
    return response.body;
  },
};


