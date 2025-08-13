import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const textClassification = createAction({
  name: 'text_classification',
  auth: huggingFaceAuth,
  displayName: 'Text Classification',
  description: 'Use a compatible classification model to categorize text (e.g., sentiment, topic)',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face classification model to use',
      required: true,
      defaultValue: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
    }),
    text: Property.LongText({
      displayName: 'Text to Classify',
      description: 'The text you want to classify',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K Results',
      description: 'Number of top classification results to return',
      required: false,
      defaultValue: 3,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { model, text, topK } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: text,
        parameters: {
          top_k: topK,
        },
      },
    });

    return response.body;
  },
}); 