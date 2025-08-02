import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { spaceIdDropdown } from '../common/props';

export const updateSpace = createAction({
  auth: PaperformAuth,
  name: 'updateSpace',
  displayName: 'Update Space',
  description: 'Update an existing space in Paperform',
  props: {
    space_id: spaceIdDropdown,
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: false,
    }),
  },
  async run(context) {
    const { space_id, name } = context.propsValue;
    const apiKey = context.auth as string;

    const spaceData: any = {};

    if (name !== undefined) {
      spaceData.name = name;
    }
    const response = await makeRequest(
      apiKey,
      HttpMethod.PUT,
      `/spaces/${space_id}`,
      spaceData
    );

    return {
      success: true,
      message: `Successfully updated space ${space_id}`,
      space: response,
    };
  },
});
