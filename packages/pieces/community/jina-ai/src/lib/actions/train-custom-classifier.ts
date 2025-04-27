import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';

export const trainCustomClassifier = createAction({
  name: 'train_custom_classifier',
  displayName: 'Train Custom Classifier',
  description: 'Fine-tune a classifier with labeled examples for domain-specific tasks',
  props: {
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Type of content to classify',
      required: true,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    model_name: Property.ShortText({
      displayName: 'Model Name',
      description: 'Name for your custom classifier model',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Model Description',
      description: 'Description of what your classifier does',
      required: false,
    }),
    training_data: Property.Json({
      displayName: 'Training Data',
      description: 'Array of labeled examples in the format: [{"text": "example text", "label": "category"}, ...] or [{"image_url": "https://example.com/image.jpg", "label": "category"}, ...]',
      required: true,
    }),
    validation_split: Property.Number({
      displayName: 'Validation Split',
      description: 'Percentage of data to use for validation (0.0 to 0.5)',
      required: false,
      defaultValue: 0.2,
    }),
    multi_label: Property.Checkbox({
      displayName: 'Multi-label Classification',
      description: 'Whether to allow multiple categories to be assigned to a single input',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { content_type, model_name, description, training_data, validation_split, multi_label } = context.propsValue;
    const { auth: apiKey } = context;

    let parsedTrainingData;
    try {
      if (typeof training_data === 'string') {
        parsedTrainingData = JSON.parse(training_data);
      } else {
        parsedTrainingData = training_data;
      }
    } catch (error) {
      throw new Error('Invalid training data format. Must be a valid JSON array of labeled examples.');
    }

    // Validate training data format based on content type
    if (!Array.isArray(parsedTrainingData) || parsedTrainingData.length === 0) {
      throw new Error('Training data must be a non-empty array of labeled examples');
    }

    for (const example of parsedTrainingData) {
      if (!example.label) {
        throw new Error('Each training example must have a "label" field');
      }
      
      if (content_type === 'text' && !example.text) {
        throw new Error('Each text training example must have a "text" field');
      }
      
      if (content_type === 'image' && !example.image_url) {
        throw new Error('Each image training example must have an "image_url" field');
      }
    }

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.classifierTrainUrl,
      method: HttpMethod.POST,
      auth: apiKey as string,
      body: {
        content_type,
        model_name,
        description,
        training_data: parsedTrainingData,
        validation_split: validation_split || 0.2,
        multi_label: multi_label || false,
      },
    });

    return response;
  },
});
