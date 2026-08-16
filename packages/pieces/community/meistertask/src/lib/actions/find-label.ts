import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findLabel = createAction({
  auth: meistertaskAuth,
  name: 'find_label',
  displayName: 'Find Label',
  description: 'Finds a label in a project',
  props: {
    project: meisterTaskCommon.project,
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
  },
  async run(context) {
    const token = getAccessToken(context.auth);
    const { project, name } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.GET,
      `/projects/${project}/labels`,
      token
    );

    const labels = Array.isArray(response.body) ? response.body : [];
    const label = labels.find((l: any) =>
      l.name && l.name.toLowerCase() === name.toLowerCase()
    );

    return label || null;
  },
});
