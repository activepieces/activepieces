import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { meistertaskAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';


export const createLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label',
  props: {
    project: meisterTaskCommon.project,
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code (e.g., #FF0000)',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project, name, color } = context.propsValue;

    const body: any = { name };
    if (color) body.color = color;

    const response = await makeRequest(
      HttpMethod.POST,
      `/projects/${project}/labels`,
      token,
      body
    );

    return response.body;
  },
});