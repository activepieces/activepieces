import { clarifaiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  CommonClarifaiProps,
  callPostInputs,
  cleanMultiInputResponse,
  fileToInput,
} from '../common';
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';

export const postInputsAction = createAction({
  auth: clarifaiAuth,
  name: 'post_inputs',
  description: 'Add inputs to your clarifai app',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file (image, video, audio, or text) as a new input into a specific Clarifai app, where it is stored for indexing, search, or training. Use to add data to a Clarifai dataset; requires the target user ID, app ID, and the file as a URL or base64 bytes. Each call appends a new input, so it is not idempotent.',
    idempotent: false,
  },
  displayName: 'Add Inputs',
  props: {
    userId: Property.ShortText({
      description: 'User ID to associate with the input',
      displayName: 'User ID',
      required: true,
    }),
    appId: Property.ShortText({
      description: 'App ID (project) to associate with the input',
      displayName: 'App ID',
      required: true,
    }),
    file: Property.File({
      description: 'URL or base64 bytes of the audio to classify',
      displayName: 'Input URL or bytes',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx;
    const { userId, appId, file } = ctx.propsValue;

    const input = fileToInput(file);

    const inputs = await callPostInputs({
      auth: auth.secret_text,
      userId,
      appId,
      input,
    });
    return cleanMultiInputResponse(inputs);
  },
});
