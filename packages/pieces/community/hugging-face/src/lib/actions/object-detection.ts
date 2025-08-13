import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const objectDetection = createAction({
  name: 'object_detection',
  auth: huggingFaceAuth,
  displayName: 'Object Detection',
  description: 'Detect and locate objects in images using AI models',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: 'The image to analyze for object detection',
      required: true,
    }),
    confidenceThreshold: Property.Number({
      displayName: 'Confidence Threshold',
      description: 'Minimum confidence score for detected objects (0.0 to 1.0)',
      required: false,
      defaultValue: 0.5,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of objects to detect',
      required: false,
      defaultValue: 100,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific object detection model to use (overrides auth model)',
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
    if (context.propsValue.confidenceThreshold !== undefined) {
      parameters.threshold = context.propsValue.confidenceThreshold;
    }
    if (context.propsValue.maxResults !== undefined) {
      parameters.max_results = context.propsValue.maxResults;
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