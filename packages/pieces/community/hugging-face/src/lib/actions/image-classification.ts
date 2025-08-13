import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const imageClassification = createAction({
  name: 'image_classification',
  auth: huggingFaceAuth,
  displayName: 'Image Classification',
  description: 'Classify an image into categories or labels using a compatible Hugging Face image classification model',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face image classification model to use',
      required: true,
      defaultValue: 'google/vit-base-patch16-224',
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to classify',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K Results',
      description: 'Number of top classification results to return',
      required: false,
      defaultValue: 5,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { model, imageUrl, topK } = context.propsValue;

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
          top_k: topK,
        },
      },
    });

    return response.body;
  },
}); 