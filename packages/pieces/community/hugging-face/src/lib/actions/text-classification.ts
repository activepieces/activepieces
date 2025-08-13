import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const textClassification = createAction({
  name: 'text_classification',
  auth: huggingFaceAuth,
  displayName: 'Text Classification',
  description: 'Categorize text using AI classification models (sentiment, topic, etc.)',
  props: {
    text: Property.LongText({
      displayName: 'Text to Classify',
      description: 'The text you want to classify',
      required: true,
    }),
    classificationType: Property.Dropdown({
      displayName: 'Classification Type',
      description: 'The type of classification to perform',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Sentiment Analysis', value: 'sentiment' },
            { label: 'Topic Classification', value: 'topic' },
            { label: 'Intent Classification', value: 'intent' },
            { label: 'Language Detection', value: 'language' },
            { label: 'Spam Detection', value: 'spam' },
            { label: 'Custom Labels', value: 'custom' },
          ],
        };
      },
    }),
    customLabels: Property.Array({
      displayName: 'Custom Labels (Optional)',
      description: 'Custom labels for classification (only used when type is "Custom Labels")',
      required: false,
      properties: {
        label: Property.ShortText({
          displayName: 'Label',
          description: 'A classification label',
          required: true,
        }),
      },
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific classification model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    let parameters = {};
    
    // Add custom labels if provided
    if (context.propsValue.classificationType === 'custom' && context.propsValue.customLabels) {
      parameters = {
        candidate_labels: context.propsValue.customLabels.map((item: { label: string }) => item.label),
      };
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