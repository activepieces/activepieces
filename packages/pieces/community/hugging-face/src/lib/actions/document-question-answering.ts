import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const documentQuestionAnswering = createAction({
  name: 'document_question_answering',
  auth: huggingFaceAuth,
  displayName: 'Document Question Answering',
  description: 'Answer questions about document images using AI models',
  props: {
    image: Property.File({
      displayName: 'Document Image',
      description: 'The document image to analyze',
      required: true,
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask about the document',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific model to use (overrides auth model)',
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
    formData.append('question', context.propsValue.question);
    
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