import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaApiCall } from '../common';
import { canvaAuth } from '../auth';

export const createDesignAction = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Creates a new Canva design.',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'The type of design to create.',
      required: false,
      defaultValue: 'CUSTOM',
      options: {
        options: [
          { label: 'Custom Size', value: 'CUSTOM' },
          { label: 'Document', value: 'DOCUMENT' },
          { label: 'Presentation', value: 'PRESENTATION' },
          { label: 'Whiteboard', value: 'WHITEBOARD' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Width in pixels. Required when Design Type is "Custom Size".',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Height in pixels. Required when Design Type is "Custom Size".',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new design.',
      required: false,
    }),
  },
  async run(context) {
    const { design_type, width, height, title } = context.propsValue;
    const accessToken = context.auth.access_token;

    const body: Record<string, unknown> = {};

    if (design_type === 'CUSTOM' && width && height) {
      body['design_type'] = { type: 'CUSTOM', width, height };
    } else if (design_type && design_type !== 'CUSTOM') {
      body['design_type'] = { type: design_type };
    }

    if (title) {
      body['title'] = title;
    }

    return canvaApiCall({
      accessToken,
      method: HttpMethod.POST,
      path: '/designs',
      body,
    });
  },
});
