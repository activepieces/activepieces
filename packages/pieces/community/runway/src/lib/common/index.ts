import { PieceAuth } from '@activepieces/pieces-framework';
import RunwayML from '@runwayml/sdk';
import * as properties from './properties';
import * as schemas from './schemas';
import {
  CancelOrDeleteATaskParams,
  GenerateImageFromTextParams,
  GenerateVideoFromImageParams,
  GetTaskDetailsParams,
} from './types';

export const runwayAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'You can get your API key from your Runway account',
  required: true,
});

export const runwayCommon = {
  // Properties
  generateImageFromTextProperties: properties.generateImageFromText,
  generateVideoFromImageProperties: properties.generateVideoFromImage,
  getTaskDetailsProperties: properties.getTaskDetails,
  cancelOrDeleteATaskProperties: properties.cancelOrDeleteATask,
  // Schemas
  generateImageFromTextSchema: schemas.generateImageFromText,
  generateVideoFromImageGen3aTurboSchema: schemas.generateVideoFromImageGen3aTurbo,
  generateVideoFromImageGen4TurboSchema: schemas.generateVideoFromImageGen4Turbo,
  getTaskDetailsSchema: schemas.getTaskDetails,
  cancelOrDeleteATaskSchema: schemas.cancelOrDeleteATask,

  // Methods
  getRunwayClient: (apiKey: string) => {
    return new RunwayML({
      apiKey: apiKey,
    });
  },
  generateImageFromText: async ({
    apiKey,
    ...imageParams
  }: GenerateImageFromTextParams) => {
    const client = runwayCommon.getRunwayClient(apiKey);
    console.info("Generating image with params:", imageParams);
    return await client.textToImage.create(imageParams);
  },
  generateVideoFromImage: async ({
    apiKey,
    ...videoParams
  }: GenerateVideoFromImageParams) => {
    const client = runwayCommon.getRunwayClient(apiKey);
    return await client.imageToVideo.create(videoParams);
  },
  getTaskDetails: async ({ apiKey, taskId }: GetTaskDetailsParams) => {
    const client = runwayCommon.getRunwayClient(apiKey);
    return await client.tasks.retrieve(taskId);
  },
  cancelOrDeleteATask: async ({
    apiKey,
    taskId,
  }: CancelOrDeleteATaskParams) => {
    const client = runwayCommon.getRunwayClient(apiKey);
    return await client.tasks.delete(taskId);
  },
};
