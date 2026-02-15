import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new Canva design using a preset type or custom dimensions.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The name of the design.',
      required: false,
    }),
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Choose a preset design type or select "Custom" to set dimensions.',
      required: true,
      options: {
        options: [
          { label: 'Custom Dimensions', value: 'custom' },
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Instagram Post', value: 'instagram_post' },
          { label: 'Instagram Story', value: 'instagram_story' },
          { label: 'Facebook Post', value: 'facebook_post' },
          { label: 'Facebook Cover', value: 'facebook_cover' },
          { label: 'Poster', value: 'poster' },
          { label: 'Flyer', value: 'flyer' },
          { label: 'Logo', value: 'logo' },
          { label: 'Business Card', value: 'business_card' },
          { label: 'Resume', value: 'resume' },
          { label: 'A4 Document', value: 'a4_document' },
          { label: 'Banner', value: 'banner' },
          { label: 'Infographic', value: 'infographic' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Width in pixels (40-8000). Required for custom dimensions.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Height in pixels (40-8000). Required for custom dimensions.',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'Optional asset ID to insert into the design (image assets only).',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};

    if (context.propsValue.title) {
      body['title'] = context.propsValue.title;
    }
    if (context.propsValue.asset_id) {
      body['asset_id'] = context.propsValue.asset_id;
    }

    if (context.propsValue.design_type === 'custom') {
      if (!context.propsValue.width || !context.propsValue.height) {
        throw new Error('Width and Height are required for custom design type.');
      }
      body['design_type'] = {
        type: 'custom',
        width: context.propsValue.width,
        height: context.propsValue.height,
      };
    } else {
      body['design_type'] = {
        type: 'preset',
        name: context.propsValue.design_type,
      };
    }

    return await canvaCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/designs',
      body,
    );
  },
});
