import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const objectDetection = createAction({
  name: 'object_detection',
  auth: huggingFaceAuth,
  displayName: 'Object Detection',
  description: 'Detect and locate objects in an image using a compatible Hugging Face object detection model',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face object detection model to use',
      required: true,
      defaultValue: 'facebook/detr-resnet-50',
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to analyze',
      required: true,
    }),
    confidence: Property.Number({
      displayName: 'Confidence Threshold',
      description: 'Minimum confidence score for detected objects (0.0 to 1.0)',
      required: false,
      defaultValue: 0.5,
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of detected objects to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const baseUrl = 'https://api-inference.huggingface.co';
    const { model, imageUrl, confidence, maxResults } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: imageUrl,
        parameters: {
          threshold: confidence,
          max_results: maxResults,
        },
      },
    });

    return response.body;
  },
}); 