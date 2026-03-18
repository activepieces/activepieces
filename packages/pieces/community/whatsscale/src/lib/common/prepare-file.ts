import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from './client';

export async function prepareFile(apiKey: string, fileUrl: string, mediaType?: string): Promise<string> {
  const body: Record<string, string> = { fileUrl };
  if (mediaType) body['mediaType'] = mediaType;
  const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/make/prepareFile', body);
  return (response.body as { url: string }).url;
}
