import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../../index';

export const trainCustomClassifierAction = createAction({
  auth:jinaAiAuth,
  name: 'train_custom_classifier',
  displayName: 'Train Custom Classifier',
  description:
    'Fine-tune a classifier with labeled examples for domain-specific tasks.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The base model to use for training.',
      required: true,
      defaultValue: 'jina-clip-v2',
      options: {
        options: [
          {
            label:
              'jina-clip-v2 - Multilingual multimodal embeddings for texts and images',
            value: 'jina-clip-v2',
          },
          {
            label:
              'jina-embeddings-v3 - Frontier multilingual embedding model with SOTA performance',
            value: 'jina-embeddings-v3',
          },
          {
            label:
              'jina-clip-v1 - Multimodal embedding models for images and English text',
            value: 'jina-clip-v1',
          },
        ],
      },
    }),
    access: Property.StaticDropdown({
      displayName: 'Access Level',
      description: 'Visibility of the trained model.',
      required: true,
      defaultValue: 'private',
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    num_iters: Property.Number({
      displayName: 'Number of Iterations',
      description: 'Number of training iterations to perform.',
      required: false,
      defaultValue: 10,
    }),
    training_data: Property.Array({
      displayName: 'Training Data',
      required: true,
      properties:{
        type:Property.StaticDropdown({
          displayName:'Input Type',
          description:'Type of input either text or image URL.',
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
          required:true
        }),
        label:Property.ShortText({
          displayName:'Label',
          required:true,
          description:'Label to associate with input.'
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
      auth: apiKey as string,
      body: requestBody,
    });

    return response;
  },
});
