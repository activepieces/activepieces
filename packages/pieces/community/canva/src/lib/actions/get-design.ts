import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest, listDesignsForDropdown } from '../common';

export const getDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  displayName: 'Get Design',
  description: 'Retrieve metadata for a Canva design including edit/view URLs and thumbnail.',
  props: {
    designId: Property.Dropdown({
      auth: canvaAuth,
      displayName: 'Design',
      description: 'The design to retrieve.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Connect your Canva account first.', options: [] };
        const options = await listDesignsForDropdown(auth as any);
        return { disabled: false, options };
      },
    }),
  },
  async run(context) {
    return canvaApiRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/designs/${context.propsValue.designId}`,
    );
  },
});
