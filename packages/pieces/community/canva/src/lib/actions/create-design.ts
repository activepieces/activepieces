import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new Canva design using a preset type or custom dimensions.',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Choose how to define the design type.',
      required: true,
      options: {
        options: [
          { label: 'Preset', value: 'preset' },
          { label: 'Custom Dimensions', value: 'custom' },
        ],
      },
    }),
    preset_name: Property.ShortText({
      displayName: 'Preset Name',
      description: 'The preset design type name (e.g. doc, presentation, whiteboard, instagram_post).',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Width of the design in pixels (40-8000). Required for custom type.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Height of the design in pixels (40-8000). Required for custom type.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The name of the design.',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The ID of an image asset to insert into the design.',
      required: false,
    }),
  },
  async run(context) {
    const { design_type, preset_name, width, height, title, asset_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const body: Record<string, unknown> = {};

    if (design_type === 'preset') {
      body['design_type'] = { type: 'preset', name: preset_name };
    } else {
      body['design_type'] = { type: 'custom', width, height };
    }

    if (title) body['title'] = title;
    if (asset_id) body['asset_id'] = asset_id;

    const response = await callCanvaApi(HttpMethod.POST, 'designs', accessToken, body);
    return response.body;
  },
});
