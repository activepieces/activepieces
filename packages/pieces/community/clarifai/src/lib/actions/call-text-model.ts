import { clarifaiAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  CommonClarifaiProps,
  callClarifaiModel,
  cleanMultiOutputResponse,
  textToInput,
} from '../common';
import { Data } from 'clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';

export const textClassifierModelPredictAction = createAction({
  auth: clarifaiAuth,
  name: 'text_classifier_model',
  description: 'Call a text classifier AI model to recognize concepts',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs input text through a Clarifai text classification model and returns the recognized concepts with confidence scores (e.g. sentiment or topic labels). Use to categorize or score text; supply the model URL and the text. Read-only inference, safe to repeat.',
    idempotent: true,
  },
  displayName: 'Classify Text',
  props: {
    modelUrl: CommonClarifaiProps.modelUrl,
    txt: Property.LongText({
      description: 'Text to classify',
      displayName: 'Input Text',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx;
    const { modelUrl, txt } = ctx.propsValue;

    const input = textToInput(txt);

    const outputs = await callClarifaiModel({
      auth: auth.secret_text,
      modelUrl,
      input,
    });
    return cleanMultiOutputResponse(outputs);
  },
});

export const textToTextModelPredictAction = createAction({
  auth: clarifaiAuth,
  name: 'text_text_model',
  description: 'Call a text to text AI model',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs input text through a Clarifai text-to-text model and returns the generated text (e.g. translation, summarization, or rewriting). Use to transform text via a specific Clarifai model; supply the model URL and the input text. Generative, so repeated calls may return different output.',
    idempotent: false,
  },
  displayName: 'Text to Text',
  props: {
    modelUrl: CommonClarifaiProps.modelUrl,
    txt: Property.LongText({
      description: 'Text to classify',
      displayName: 'Input Text',
      required: true,
    }),
  },
  async run(ctx) {
    const { auth } = ctx;
    const { modelUrl, txt } = ctx.propsValue;

    const input = textToInput(txt);

    const outputs = await callClarifaiModel({
      auth: auth.secret_text,
      modelUrl,
      input,
    });
    return cleanMultiOutputResponse(outputs);
  },
});
