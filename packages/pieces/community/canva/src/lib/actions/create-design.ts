import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';

export const canvaCreateDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva',
  props: {
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the new design',
      required: false,
    }),
    designType: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Type of design to create (preset dimensions)',
      required: false,
      options: {
        options: [
          { label: 'Custom', value: '' },
          { label: 'Poster', value: 'poster' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Social Media Post', value: 'social_media' },
          { label: 'Logo', value: 'logo' },
          { label: 'Instagram Post', value: 'instagram_post' },
          { label: 'Instagram Story', value: 'instagram_story' },
          { label: 'Facebook Post', value: 'facebook_post' },
          { label: 'Twitter Post', value: 'twitter_post' },
          { label: 'YouTube Thumbnail', value: 'youtube_thumbnail' },
          { label: 'A4 Document', value: 'a4_document' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Custom width in pixels (required if no design type)',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Custom height in pixels (required if no design type)',
      required: false,
    }),
  },
  async run(context) {
    const { title, designType, width, height } = context.propsValue;
    const accessToken = context.auth.access_token;

    const body: Record<string, unknown> = {};

    if (title) {
      body['title'] = title;
    }

    if (designType) {
      body['design_type'] = { type: designType };
    } else if (width && height) {
      body['design_type'] = {
        type: 'custom',
        width: Math.round(width),
        height: Math.round(height),
      };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/designs',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
