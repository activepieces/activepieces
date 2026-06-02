import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const canvaCreateDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva.',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'The preset design type to create.',
      required: true,
      defaultValue: 'doc',
      options: {
        disabled: false,
        options: [
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation (16:9)', value: 'presentation' },
          { label: 'Instagram Post (Square)', value: 'instagram_post_square' },
          { label: 'Instagram Story', value: 'instagram_story' },
          { label: 'LinkedIn Post (Landscape)', value: 'linkedin_post' },
          { label: 'Facebook Post', value: 'facebook_post' },
          { label: 'Twitter Post', value: 'twitter_post' },
          { label: 'Poster (Portrait)', value: 'poster' },
          { label: 'Flyer (Portrait)', value: 'flyer_portrait' },
          { label: 'Resume', value: 'resume' },
          { label: 'Certificate', value: 'certificate' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new design.',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'ID of an asset to use as the design background.',
      required: false,
    }),
  },
  async run(context) {
    const { design_type, title, asset_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    const body: Record<string, unknown> = {
      design_type: {
        type: 'preset',
        name: design_type,
      },
    };

    if (title) {
      body['title'] = title;
    }

    if (asset_id) {
      body['asset_id'] = asset_id;
    }

    const result = await canvaApiCall<{ design: unknown }>({
      accessToken,
      method: HttpMethod.POST,
      resourceUrl: '/designs',
      body,
    });

    return result;
  },
});
