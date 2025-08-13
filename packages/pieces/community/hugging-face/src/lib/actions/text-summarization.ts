import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const textSummarization = createAction({
  name: 'text_summarization',
  auth: huggingFaceAuth,
  displayName: 'Text Summarization',
  description: 'Generate an abstractive summary of long text using a summarization model',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face summarization model to use',
      required: true,
      defaultValue: 'facebook/bart-large-cnn',
    }),
    text: Property.LongText({
      displayName: 'Text to Summarize',
      description: 'The long text you want to summarize',
      required: true,
    }),
    maxLength: Property.Number({
      displayName: 'Maximum Length',
      description: 'Maximum length of the generated summary',
      required: false,
      defaultValue: 130,
    }),
    minLength: Property.Number({
      displayName: 'Minimum Length',
      description: 'Minimum length of the generated summary',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const baseUrl = 'https://api-inference.huggingface.co';
    const { model, text, maxLength, minLength } = context.propsValue;

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
          max_length: maxLength,
          min_length: minLength,
          do_sample: false,
        },
      },
    });

    return response.body;
  },
}); 