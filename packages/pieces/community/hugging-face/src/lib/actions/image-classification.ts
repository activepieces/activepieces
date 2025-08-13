import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const imageClassification = createAction({
  name: 'image_classification',
  auth: huggingFaceAuth,
  displayName: 'Image Classification',
  description: 'Classify images into categories or labels using AI models',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image to classify',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K Results',
      description: 'Number of top classification results to return',
      required: false,
      defaultValue: 5,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific image classification model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    const formData = new FormData();
    // Convert ApFile to Blob for FormData
    const mimeType = context.propsValue.image.extension ? `image/${context.propsValue.image.extension}` : 'image/jpeg';
    const imageBlob = new Blob([context.propsValue.image.data], { type: mimeType });
    formData.append('image', imageBlob, context.propsValue.image.filename);
    
    const parameters: any = {};
    if (context.propsValue.topK !== undefined) {
      parameters.top_k = context.propsValue.topK;
    }
    
    if (Object.keys(parameters).length > 0) {
      formData.append('parameters', JSON.stringify(parameters));
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  },
}); 