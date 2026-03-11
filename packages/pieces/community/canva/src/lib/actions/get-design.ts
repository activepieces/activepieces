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

export const getDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  displayName: 'Get Design',
  description: 'Get details of a specific Canva design.',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.GET,
      url: `${CANVA_BASE_URL}/designs/${context.propsValue.design_id}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.body;
  },
});
