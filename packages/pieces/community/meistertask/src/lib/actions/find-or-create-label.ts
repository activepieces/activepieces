import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateLabel = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_label',
  displayName: 'Find or Create Label',
  description: 'Finds a label or creates one if it does not exist',
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

    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/projects/${project}/labels`,
      token
    );

    const labels = Array.isArray(findResponse.body) ? findResponse.body : [];
    const existing = labels.find((l: any) =>
      l.name && l.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return {
        found: true,
        created: false,
        label: existing,
      };
    }

    const body: { name: string; color?: string } = {
      name,
    };
    if (color) body.color = color;

    const createResponse = await makeRequest(
      HttpMethod.POST,
      `/projects/${project}/labels`,
      token,
      body
    );

    return {
      found: false,
      created: true,
      label: createResponse.body,
    };
  },
});
