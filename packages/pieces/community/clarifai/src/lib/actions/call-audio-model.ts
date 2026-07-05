import { clarifaiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  CommonClarifaiProps,
  callClarifaiModel,
  cleanMultiOutputResponse,
  fileToInput,
} from '../common';
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';

export const audioToTextModelPredictAction = createAction({
  auth: clarifaiAuth,
  name: 'audio_text_model',
  description: 'Call a audio to text AI model',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs an audio file through a Clarifai audio-to-text model and returns the transcribed text. Use to transcribe speech or audio; supply the model URL and the file as a URL or base64 bytes. Read-only inference, safe to repeat.',
    idempotent: true,
  },
  displayName: 'Audio to Text',
  props: {
    modelUrl: CommonClarifaiProps.modelUrl,
    file: Property.File({
      description: 'URL or base64 bytes of the audio to classify',
      displayName: 'Input URL or bytes',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx;
    const { modelUrl, file } = ctx.propsValue;

    const input = fileToInput(file);

    const outputs = await callClarifaiModel({
      auth: auth.secret_text,
      modelUrl,
      input,
    });
    return cleanMultiOutputResponse(outputs);
  },
});
