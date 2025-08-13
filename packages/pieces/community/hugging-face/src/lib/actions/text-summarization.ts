import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const textSummarization = createAction({
  name: 'text_summarization',
  auth: huggingFaceAuth,
  displayName: 'Text Summarization',
  description: 'Generate concise summaries of long text using AI models',
  props: {
    text: Property.LongText({
      displayName: 'Text to Summarize',
      description: 'The long text you want to summarize',
      required: true,
    }),
    maxLength: Property.Number({
      displayName: 'Maximum Length',
      description: 'Maximum length of the summary (in words)',
      required: false,
      defaultValue: 150,
    }),
    minLength: Property.Number({
      displayName: 'Minimum Length',
      description: 'Minimum length of the summary (in words)',
      required: false,
      defaultValue: 50,
    }),
    doSample: Property.Checkbox({
      displayName: 'Use Sampling',
      description: 'Whether to use sampling for generation',
      required: false,
      defaultValue: false,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific summarization model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    const parameters: any = {};
    
    if (context.propsValue.maxLength) {
      parameters.max_length = context.propsValue.maxLength;
    }
    if (context.propsValue.minLength) {
      parameters.min_length = context.propsValue.minLength;
    }
    if (context.propsValue.doSample !== undefined) {
      parameters.do_sample = context.propsValue.doSample;
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: context.propsValue.text,
        parameters,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  },
}); 