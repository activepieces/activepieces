import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../auth';

export const trainCustomClassifierAction = createAction({
  auth:jinaAiAuth,
  name: 'train_custom_classifier',
  classification: 'WRITE',
  displayName: 'Train Custom Classifier',
  description:
    'Fine-tune a classifier with labeled examples for domain-specific tasks.',
  audience: 'both',
  aiMetadata: {
    description:
      'Train a custom Jina AI classifier from an array of labeled text or image-URL examples, choosing the base embedding model, iteration count, and private/public visibility. Pick this only when zero-shot labeling (Classify Text or Image) is not accurate enough and you have labeled training data. Each call creates a new training job/classifier, so repeated calls are not idempotent.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Base model to fine-tune.',
      required: true,
      defaultValue: 'jina-clip-v2',
      options: {
        options: [
          {
            label: 'jina-clip-v2: text and images',
            value: 'jina-clip-v2',
          },
          {
            label: 'jina-embeddings-v3: text only',
            value: 'jina-embeddings-v3',
          },
          {
            label: 'jina-clip-v1: images and English text',
            value: 'jina-clip-v1',
          },
        ],
      },
    }),
    access: Property.StaticDropdown({
      displayName: 'Access Level',
      description: 'Who can use the trained classifier.',
      display: 'cards',
      required: true,
      defaultValue: 'private',
      options: {
        options: [
          { label: 'Private', value: 'private', description: 'Only your account', icon: 'user' },
          { label: 'Public', value: 'public', description: 'Anyone with the ID', icon: 'users' },
        ],
      },
    }),
    num_iters: Property.Number({
      displayName: 'Training Iterations',
      description: 'More iterations train longer. Empty: 10.',
      required: false,
      defaultValue: 10,
    }),
    training_data: Property.Array({
      displayName: 'Training Data',
      description: 'Labeled examples to learn from, one per row.',
      required: true,
      properties:{
        type:Property.StaticDropdown({
          displayName:'Input Type',
          description:'Text, or an image URL.',
          required:true,
          defaultValue:'text',
          options:{
            disabled:false,
            options:[
              {label:'Text',value:'text'},
              {label:'Image',value:'image'}
            ]
          }
        }),
        input:Property.LongText({
          displayName:'Input',
          description:'The text, or the image URL.',
          required:true
        }),
        label:Property.ShortText({
          displayName:'Label',
          required:true,
          description:'Category this example belongs to.'
        })
      }
    }),
  },
  async run(context) {
    const { model, access, num_iters,training_data } = context.propsValue;
    const { auth: apiKey } = context;

    let parsedTrainingData: Array<{ type: string; label: string; input: string }> = [];
    try {
      parsedTrainingData =
      typeof training_data === 'string'
        ? JSON.parse(training_data)
        : (training_data ?? []);

    } catch (error) {
      throw new Error(
        'Invalid training data format. Must be a valid JSON array of labeled examples.'
      );
    }

    if (!Array.isArray(parsedTrainingData) || parsedTrainingData.length === 0) {
      throw new Error(
        'Training data must be a non-empty array of labeled examples, you can check an example at https://jina.ai/api-dashboard/classifier'
      );
    }

    const trainingInput = parsedTrainingData.map((example) => {
      const { type, label, input } = example;
  
      if (!label) {
        throw new Error('Each training example must have a "label" field.');
      }
  
      if (!input) {
        throw new Error(
          'Each training example must include an "input" value for either text or image.'
        );
      }
  
      return type === 'text'
        ? { label, text: input }
        : { label, image: input };
    });

    const requestBody = {
      model: model || 'jina-clip-v2',
      access: access || 'private',
      num_iters: num_iters || 10,
      input: trainingInput,
    };

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.classifierTrainUrl,
      method: HttpMethod.POST,
      auth: apiKey.secret_text,
      body: requestBody,
    });

    return response;
  },
});
