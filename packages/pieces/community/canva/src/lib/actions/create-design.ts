import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new blank Canva design with a preset or custom dimensions.',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Choose a preset type or select Custom for specific dimensions.',
      required: true,
      defaultValue: 'preset',
      options: {
        options: [
          { label: 'Preset Type', value: 'preset' },
          { label: 'Custom Dimensions', value: 'custom' },
        ],
      },
    }),
    preset_name: Property.ShortText({
      displayName: 'Preset Name',
      description: 'e.g. "presentation", "instagram_post", "a4_document". Required when Design Type is Preset.',
      required: false,
    }),
    width_px: Property.Number({
      displayName: 'Width (px)',
      description: 'Required when Design Type is Custom.',
      required: false,
    }),
    height_px: Property.Number({
      displayName: 'Height (px)',
      description: 'Required when Design Type is Custom.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Optional title for the new design.',
      required: false,
    }),
  },
  async run(context) {
    const { design_type, preset_name, width_px, height_px, title } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (title) body['title'] = title;

    if (design_type === 'preset') {
      body['design_type'] = { type: 'preset', name: preset_name };
    } else {
      body['design_type'] = {
        type: 'custom',
        width: width_px,
        height: height_px,
      };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/designs',
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
