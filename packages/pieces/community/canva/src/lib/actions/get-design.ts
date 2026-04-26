import { createAction } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest, canvaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  displayName: 'Get Design',
  description: 'Retrieve details about a specific Canva design by its ID, including title, type, thumbnail, and edit URL.',
  props: {
    designId: canvaCommon.designId,
  },
  async run(context) {
    const { designId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.GET,
      path: `/designs/${designId}`,
    });

    return response;
  },
});
