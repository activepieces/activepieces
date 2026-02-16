import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { designTypeDropdown } from '../common';
import { CanvaDesign } from '../common/types';

export const createDesignAction = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva',
  props: {
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'The title of the design',
      required: false,
    }),
    designType: designTypeDropdown,
  },
  async run(context) {
    const { title, designType } = context.propsValue;

    const body: Record<string, unknown> = {
      design_type: {
        type: 'preset',
        name: designType,
      },
    };

    if (title) {
      body.title = title;
    }

    const response = await canvaApiCall<{ design: CanvaDesign }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/designs',
      body,
    });

    return response.design;
  },
});
