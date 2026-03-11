import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../lib/auth';
import { CANVA_BASE_URL } from '../../lib/common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva.',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'The type of design to create.',
      required: true,
      options: {
        options: [
          { label: 'Presentation', value: 'presentation' },
          { label: 'Social Media Post', value: 'social_media' },
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title for the new design.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const body: Record<string, unknown> = {
      design_type: {
        type: context.propsValue.design_type,
      },
    };
    if (context.propsValue.title) {
      body['title'] = context.propsValue.title;
    }

    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/designs`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
