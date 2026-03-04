import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from './client';

export async function prepareFile(apiKey: string, fileUrl: string): Promise<string> {
  const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/make/prepareFile', { fileUrl });
  return (response.body as { url: string }).url;
}
