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
    getresponse: '/predictions',
    getFile: (fileId: string) => `/files/${fileId}`,
  },

  // Methods
  getresponse: async (apiKey: string, requestId: string, status: string) => {
    let statusnow = status;
    const timeoutAt = Date.now() + 5 * 60 * 1000;

    while (statusnow !== 'completed' && Date.now() < timeoutAt) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollRes = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `${vlmRunCommon.baseUrl}${vlmRunCommon.endpoints.getresponse}/${requestId}`,
        headers: vlmRunCommon.baseHeaders(apiKey),
      });

      statusnow = pollRes.body?.status;
      console.log('first', statusnow);
      if (statusnow === 'completed') {
        return pollRes.body.response;
      }
    }

    throw new Error('generation timed out or failed.');
  },
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


