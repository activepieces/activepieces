import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description:
    'Create a new Canva design from scratch or from a preset design type. Returns the design ID and edit URL.',
  props: {
    designType: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'The type of design to create.',
      required: false,
      options: {
        options: [
          { label: 'Presentation', value: 'presentation' },
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Logo', value: 'logo' },
          { label: 'Poster', value: 'poster' },
          { label: 'Flyer', value: 'flyer' },
          { label: 'Resume', value: 'resume' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title for the new design.',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Custom width in pixels. Required when not using a preset design type.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Custom height in pixels. Required when not using a preset design type.',
      required: false,
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      description: 'Unit for custom dimensions.',
      required: false,
      options: {
        options: [
          { label: 'Pixels (px)', value: 'px' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Inches (in)', value: 'in' },
        ],
      },
    }),
    assetId: Property.ShortText({
      displayName: 'Asset ID (optional)',
      description: 'ID of an asset to use as the design background.',
      required: false,
    }),
  },
  async run(context) {
    const { designType, title, width, height, unit, assetId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body: Record<string, unknown> = {};

    if (designType) {
      body['design_type'] = { type: 'preset', name: designType };
    } else if (width && height) {
      body['design_type'] = {
        type: 'custom',
        width,
        height,
        unit: unit ?? 'px',
      };
    }

    if (title) body['title'] = title;
    if (assetId) body['asset_id'] = assetId;

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.POST,
      path: '/designs',
      body,
    });

    return response;
  },
});
