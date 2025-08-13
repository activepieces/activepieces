import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const documentQuestionAnswering = createAction({
  name: 'document_question_answering',
  auth: huggingFaceAuth,
  displayName: 'Document Question Answering',
  description: 'Run a compatible Hugging Face model to answer a question using an image of a document',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face model to use for document question answering',
      required: true,
      defaultValue: 'microsoft/DialoGPT-medium',
    }),
    question: Property.LongText({
      displayName: 'Question',
      description: 'The question to ask about the document',
      required: true,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the document image',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const baseUrl = 'https://api-inference.huggingface.co';
    const { model, question, imageUrl } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: {
          question: question,
          image: imageUrl,
        },
      },
    });

    return response.body;
  },
}); 