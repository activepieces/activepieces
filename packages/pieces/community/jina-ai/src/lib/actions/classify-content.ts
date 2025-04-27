import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';

export const classifyContent = createAction({
  name: 'classify_content',
  displayName: 'Classify Text or Image',
  description:
    'Assign categories to text or images using the Classifier API (zero-shot/few-shot)',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for classification',
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
    inputs: Property.Array({
      displayName: 'Inputs',
      description:
        'Array of text strings or image URLs to classify. URLs will be treated as images, other strings as text.',
      required: true,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The labels to classify the content into',
      required: true,
    }),
  },
  async run(context) {
    const { model, inputs, labels } = context.propsValue;
    const { auth: apiKey } = context;

    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      throw new Error('At least one input is required');
    }

    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      throw new Error('At least one label must be provided');
    }

    const inputArray = inputs
      .map((input) => {
        if (!input || typeof input !== 'string') return null;

        const isUrl = !!input.trim().match(/^(https?|ftp|file|data):\/\/.+/i);

        if (isUrl) {
          return { image: input };
        } else {
          return { text: input };
        }
      })
      .filter((item) => item !== null); // Remove any null items

    if (inputArray.length === 0) {
      throw new Error('No valid inputs provided');
    }

    const requestBody = {
      model: model || 'jina-clip-v2',
      input: inputArray,
      labels,
    };

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.classifierUrl,
      method: HttpMethod.POST,
      auth: apiKey as string,
      body: requestBody,
    });

    return response;
  },
});
