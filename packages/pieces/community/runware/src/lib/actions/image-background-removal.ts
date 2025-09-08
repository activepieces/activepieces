import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { compactObject, runwareRequest } from '../../lib/client';

type BackgroundRemovalResponse = {
  id?: string;
  status?: 'queued' | 'running' | 'succeeded' | 'failed';
  image?: {
    url?: string;
    base64?: string;
    mime_type?: string;
    width?: number;
    height?: number;
  };
  error?: unknown;
  [k: string]: unknown;
};

export const removeImageBackground = createAction({
  name: 'removeImageBackground',
  displayName: 'Image Background Removal',
  description: 'Request image background removal.',
  props: {
    imageUrl: Property.ShortText({
      displayName: 'Image URL or Base64',
      required: true,
      description: 'Public URL or base64 data for the image.',
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      options: {
        options: [
          { label: 'PNG (transparent)', value: 'png' },
          { label: 'WEBP', value: 'webp' },
          { label: 'JPEG (white bg)', value: 'jpeg' },
        ],
      },
      defaultValue: 'png',
    }),
    refine: Property.Checkbox({
      displayName: 'Refine Edges',
      required: false,
      defaultValue: true,
    }),
    endpointOverride: Property.ShortText({
      displayName: 'Endpoint Override',
      required: false,
      description:
        'Optional. Override the default endpoint. Defaults to /v1/images/background-removal.',
    }),
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;

    
    const url = ctx.propsValue.endpointOverride || '/v1/images/background-removal';

    const body = compactObject({
      image: ctx.propsValue.imageUrl,
      format: ctx.propsValue.outputFormat,
      refine: ctx.propsValue.refine,
    });

    const res = await runwareRequest<BackgroundRemovalResponse>({
      apiKey,
      method: HttpMethod.POST,
      url,
      body,
    });

    return res;
  },
});