import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLabel = createAction({
  auth: meistertaskAuth,
  name: 'create_label',
  displayName: 'Create Label',
  description: 'Creates a new label in a project',
  props: {
    project: meisterTaskCommon.project,
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color (Hex)',
      required: false,
    }),
  },
  async run(context) {
    const token = getAccessToken(context.auth);
    const { project, name, color } = context.propsValue;

    const body: { name: string; color?: string } = {
      name,
    };
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
