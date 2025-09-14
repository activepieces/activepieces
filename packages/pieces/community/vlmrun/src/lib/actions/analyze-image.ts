import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { VlmRunAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const analyzeImage = createAction({
  name: 'analyze-image',
  displayName: 'Analyze Image',
  description: 'Process an image (file or URL), extracting descriptions, detecting objects, etc.',
  auth: VlmRunAuth,
  props: {
    images: Property.Array({
      displayName: 'Images',
      description: 'List of image URLs or base64 encoded images to analyze.',
      required: true,
    }),
    domain: Property.StaticDropdown({
      displayName: 'Domain',
      description: 'Select the analysis domain for image processing.',
      required: true,
      options: {
        options: [
          { label: 'Aerospace Remote Sensing', value: 'aerospace.remote-sensing' },
          { label: 'Document Invoice', value: 'document.invoice' },
          { label: 'Document Markdown', value: 'document.markdown' },
          { label: 'Document Receipt', value: 'document.receipt' },
          { label: 'Document Resume', value: 'document.resume' },
          { label: 'Image Caption', value: 'image.caption' },
          { label: 'Experimental Image Object Detection', value: 'experimental.image.object-detection' },
          { label: 'Experimental Image Person Detection', value: 'experimental.image.person-detection' },
          { label: 'Retail Product Catalog', value: 'retail.product-catalog' },
          { label: 'Image TV News', value: 'image.tv-news' },
          { label: 'Video Caption', value: 'video.caption' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional metadata to pass to the model.',
      required: false,
    }),
    config: Property.Json({
      displayName: 'Config',
      description: 'Optional VLM generation config.',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional URL to call when the request is completed.',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Select the model to use for generating the response.',
      required: true,
      defaultValue: 'vlm-1',
      options: {
        options: [{ label: 'vlm-1', value: 'vlm-1' }],
      },
    }),
    batch: Property.Checkbox({
      displayName: 'Batch Mode',
      description: 'Whether to process the image in batch mode (async).',
      defaultValue: false,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      domain: propsValue.domain,
      images: propsValue.images,
      metadata: propsValue.metadata,
      config: propsValue.config,
      callback_url: propsValue.callback_url,
      model: propsValue.model,
      batch: propsValue.batch,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/image/generate`,
      body
    );
    return response;
  },
});
