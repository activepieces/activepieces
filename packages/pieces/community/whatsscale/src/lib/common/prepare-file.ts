import { HttpMethod } from '@activepieces/pieces-common';
import { ApFile, FilesService } from '@activepieces/pieces-framework';
import { whatsscaleClient } from './client';

export async function prepareMediaFile({
  apiKey,
  file,
  files,
  mediaType,
}: PrepareMediaFileParams): Promise<string> {
  const fileUrl = await files.write({
    fileName: file.filename,
    data: file.data,
  });
  const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/make/prepareFile', {
    fileUrl,
    mediaType,
  });
  return (response.body as { url: string }).url;
}

export type WhatsscaleMediaType = 'image' | 'video' | 'document' | 'audio';

export type PrepareMediaFileParams = {
  apiKey: string;
  file: ApFile;
  files: FilesService;
  mediaType: WhatsscaleMediaType;
};
