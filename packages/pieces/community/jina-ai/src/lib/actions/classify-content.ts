import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';
import { jinaAiAuth } from '../auth';
import { classifyContentOutputSchema } from '../output-schemas';

export const classifyContentAction = createAction({
  auth:jinaAiAuth,
  name: 'classify_content',
  outputSchema: classifyContentOutputSchema,
  classification: 'READ',
  displayName: 'Classify Text or Image',
  description:
    'Assign categories to text or images using the Classifier API (zero-shot/few-shot).',
  audience: 'both',
  aiMetadata: {
    description:
      'Classify a single piece of text or an image URL into one of a provided set of labels using Jina AI zero-shot classification; returns the winning label. Pick this to categorize content against your own label set without training; if the input string is a URL it is treated as an image. Stateless inference, so repeat calls are idempotent. To fine-tune a reusable classifier on labeled examples instead, use Train Custom Classifier.',
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Image URLs need a CLIP model.',
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
    input: Property.LongText({
      displayName: 'Text or Image URL',
      description:
        'A URL is classified as an image, anything else as text.',
      placeholder: 'Paste text or an image URL',
      required: true,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Categories to choose from. The best match is returned.',
      required: true,
    }),
  },
  async run(context) {
    const { model, input, labels } = context.propsValue;
    const { auth: apiKey } = context;

    if (!input || input==='') {
      throw new Error('Text input is required.');
    }

    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      throw new Error('At least one label must be provided.');
    }

    const isUrl = !!input.trim().match(/^(https?|ftp|file|data):\/\/.+/i);


    const inputArray = [
      isUrl?{image: input} :{ text: input }
    ]


    if (inputArray.length === 0) {
      throw new Error('No valid inputs provided.');
    }

    const requestBody = {
      model: model || 'jina-clip-v2',
      input: inputArray,
      labels,
    };

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.classifierUrl,
      method: HttpMethod.POST,
      auth: apiKey.secret_text,
      body: requestBody,
    });

    const result = (response as ClassifyTextResponse).data[0].prediction

    return {
      label:result
    };
  },
});

type ClassifyTextResponse = {
  data:Array<{
    prediction:string,
    score:number
  }>
}