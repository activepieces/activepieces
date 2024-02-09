import { clarifaiAuth } from '../../';
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
      auth,
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
      auth,
      modelUrl,
      input,
    });
    return cleanMultiOutputResponse(outputs);
  },
});
