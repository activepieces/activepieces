import { meistertaskAuth } from '../../index';
import {  makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateLabel = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_label',
  displayName: 'Find or Create Label',
  description: 'Finds a label by searching, or creates one if it doesn\'t exist',
  props: {
    project: meisterTaskCommon.project,
    name: Property.ShortText({
      displayName: 'Label Name',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color code (e.g., #FF0000) - used if creating',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { project, name, color } = context.propsValue;

    // Try to find existing label
    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/projects/${project}/labels`,
      token
    );

    const existingLabel = findResponse.body.find((label: any) =>
      label.name.toLowerCase() === name.toLowerCase()
    );

    if (existingLabel) {
      return {
        found: true,
        created: false,
        label: existingLabel,
      };
    }

    // Create new label
    const body: any = { name };
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