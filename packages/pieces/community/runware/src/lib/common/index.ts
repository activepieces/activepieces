import { PieceAuth } from '@activepieces/pieces-framework';
import { Runware } from '@runware/sdk-js';
import * as properties from './properties';
import * as schemas from './schemas';
import {
    GenerateImagesParams,
    GenerateVideoFromTextParams,
    ImageBackgroundRemovalParams,
} from './types';

export const runwareAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'You can get the API key from your Runware account',
  required: true,
});

export const runwareCommon = {
  runwareClient: (apiKey: string) => {
    return new Runware({ apiKey });
  },

  // Properties
  generateImagesFromTextProperties: properties.generateImagesFromText,
  generateImagesFromExistingImageProperties:
    properties.generateImagesFromExistingImage,
  generateVideoFromTextProperties: properties.generateVideoFromText,
  imageBackgroundRemovalProperties: properties.imageBackgroundRemoval,

  // Schemas
  generateImagesFromTextSchema: schemas.generateImagesFromText,
  generateImagesFromExistingImageSchema:
    schemas.generateImagesFromExistingImage,
  generateVideoFromTextSchema: schemas.generateVideoFromText,
  imageBackgroundRemovalSchema: schemas.imageBackgroundRemoval,

  // API methods
  generateImages: async ({ apiKey, ...imageParams }: GenerateImagesParams) => {
    const client = runwareCommon.runwareClient(apiKey);
    return await client.requestImages(imageParams);
  },
  generateVideoFromText: async ({
    apiKey,
    ...videoParams
  }: GenerateVideoFromTextParams) => {
    const client = runwareCommon.runwareClient(apiKey);
    return await client.videoInference(videoParams);
  },
  imageBackgroundRemoval: async ({
    apiKey,
    ...imageParams
  }: ImageBackgroundRemovalParams) => {
    const client = runwareCommon.runwareClient(apiKey);
    return await client.removeImageBackground(imageParams);
  },
};
