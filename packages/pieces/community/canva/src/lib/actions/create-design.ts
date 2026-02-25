import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new Canva design using a preset type or custom dimensions.',
  props: {
    designTypeOption: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Use a preset template or specify custom dimensions.',
      required: true,
      defaultValue: 'preset',
      options: {
        options: [
          { label: 'Preset Type', value: 'preset' },
          { label: 'Custom Dimensions', value: 'custom' },
        ],
      },
    }),
    presetName: Property.StaticDropdown({
      displayName: 'Preset Type',
      description: 'Required when Design Type is set to Preset.',
      required: false,
      options: {
        options: [
          { label: 'Document (Canva Docs)', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
        ],
      },
    }),
    customWidth: Property.Number({
      displayName: 'Width (pixels)',
      description: 'Required when Design Type is Custom. Between 40 and 8000.',
      required: false,
    }),
    customHeight: Property.Number({
      displayName: 'Height (pixels)',
      description: 'Required when Design Type is Custom. Between 40 and 8000.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name for the design (1–255 characters).',
      required: false,
    }),
  },
  async run(context) {
    const { designTypeOption, presetName, customWidth, customHeight, title } = context.propsValue;

    if (designTypeOption === 'preset' && !presetName) {
      throw new Error('Preset type is required when Design Type is Preset.');
    }
    if (designTypeOption === 'custom') {
      if (!customWidth || !customHeight) {
        throw new Error('Width and height are required when Design Type is Custom.');
      }
      if (customWidth < 40 || customWidth > 8000 || customHeight < 40 || customHeight > 8000) {
        throw new Error('Width and height must be between 40 and 8000 pixels.');
      }
    }

    const body: Record<string, unknown> = {};
    if (designTypeOption === 'preset') {
      body['design_type'] = { type: 'preset', name: presetName };
    } else {
      body['design_type'] = { type: 'custom', width: customWidth, height: customHeight };
    }
    if (title) body['title'] = title;

    return canvaApiRequest(context.auth.access_token, HttpMethod.POST, '/designs', body);
  },
});
