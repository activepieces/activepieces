import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../common';

export const classifyContent = createAction({
  name: 'classify_content',
  displayName: 'Classify Text or Image',
  description: 'Assign categories to text or images using the Classifier API (zero-shot/few-shot)',
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
    text: Property.LongText({
      displayName: 'Text Content',
      description: 'The text content to classify',
      required: false,
      defaultValue: '',
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to classify',
      required: false,
      defaultValue: '',
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'List of categories to classify against (for zero-shot classification)',
      required: false,
    }),
    model_id: Property.ShortText({
      displayName: 'Model ID',
      description: 'ID of a custom trained model (leave empty for zero-shot classification)',
      required: false,
    }),
    multi_label: Property.Checkbox({
      displayName: 'Multi-label Classification',
      description: 'Whether to allow multiple categories to be assigned (true) or just the top category (false)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { content_type, text, image_url, categories, model_id, multi_label } = context.propsValue;
    const { auth: apiKey } = context;
    
    // Validate required fields based on content type
    if (content_type === 'text' && !text) {
      throw new Error('Text content is required when content type is text');
    }
    
    if (content_type === 'image' && !image_url) {
      throw new Error('Image URL is required when content type is image');
    }

    const requestBody: Record<string, unknown> = {
      multi_label: multi_label || false,
    };

    if (model_id) {
      requestBody['model_id'] = model_id;
    } else if (categories && Array.isArray(categories)) {
      requestBody['categories'] = categories;
    } else {
      throw new Error('Either categories or model_id must be provided');
    }

    if (content_type === 'text') {
      requestBody['text'] = text;
    } else if (content_type === 'image') {
      requestBody['image_url'] = image_url;
    }

    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.classifierUrl,
      method: HttpMethod.POST,
      auth: apiKey as string,
      body: requestBody,
    });

    return response;
  },
});
