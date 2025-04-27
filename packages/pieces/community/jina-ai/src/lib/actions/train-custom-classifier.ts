import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';

export const trainCustomClassifier = createAction({
  name: 'train_custom_classifier',
  displayName: 'Train Custom Classifier',
  description:
    'Fine-tune a classifier with labeled examples for domain-specific tasks',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The base model to use for training',
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
      description: 'Visibility of the trained model',
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
      description: 'Number of training iterations to perform',
      required: false,
      defaultValue: 10,
    }),
    training_data: Property.Json({
      displayName: 'Training Data',
      description:
        'Array of labeled examples in the format: [{"text": "example text", "label": "category"}, ...] or [{"image": "https://example.com/image.jpg", "label": "category"}, ...]',
      required: true,
    }),
  },
  async run(context) {
    const { model, access, num_iters, training_data } = context.propsValue;
    const { auth: apiKey } = context;

    let parsedTrainingData;
    try {
      if (typeof training_data === 'string') {
        parsedTrainingData = JSON.parse(training_data);
      } else {
        parsedTrainingData = training_data;
      }
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

    for (const example of parsedTrainingData) {
      if (!example.label) {
        throw new Error('Each training example must have a "label" field');
      }

      if (!example.text && !example.image) {
        throw new Error(
          'Each training example must have either a "text" field for text content or an "image" field containing an image URL'
        );
      }
    }

    const requestBody = {
      model: model || 'jina-clip-v2',
      access: access || 'private',
      num_iters: num_iters || 10,
      input: parsedTrainingData,
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
