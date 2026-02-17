import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaCreateDesign = createAction({
  auth: canvaAuth,
  name: 'create_canva_design',
  description: 'Create a new Canva design',
  displayName: 'Create Design',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'The type of design to create.',
      required: true,
      options: {
        options: [
          { label: 'Custom', value: 'custom' },
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
        ],
      },
      defaultValue: 'custom',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the design (1-255 characters).',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description:
        'Width in pixels (40-8000). Required when design type is Custom.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description:
        'Height in pixels (40-8000). Required when design type is Custom.',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description:
        'The ID of an image asset to include in the design (optional).',
      required: false,
    }),
  },
  async run(context) {
    const { design_type, title, width, height, asset_id } =
      context.propsValue;

    let designTypeBody: Record<string, unknown>;

    if (design_type === 'custom') {
      designTypeBody = {
        type: 'custom',
        width: width ?? 1080,
        height: height ?? 1080,
      };
    } else {
      designTypeBody = {
        type: 'preset',
        name: design_type,
      };
    }

    const body: Record<string, unknown> = {
      design_type: designTypeBody,
    };

    if (title) {
      body.title = title;
    }

    if (asset_id) {
      body.asset_id = asset_id;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/designs',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
