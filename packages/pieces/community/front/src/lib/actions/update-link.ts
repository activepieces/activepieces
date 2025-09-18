import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { linkDropdown } from '../common/props';

export const updateLink = createAction({
  auth: frontAuth,
  name: 'update_link',
  displayName: 'Update Link',
  description: 'Update the name of a Link.',
  props: {
    link_id: linkDropdown,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name for the link.',
      required: true,
    }),
  },
  async run(context) {
    const { link_id, name } = context.propsValue;
    const token = context.auth;

    await makeRequest(
        token,
        HttpMethod.PATCH,
        `/links/${link_id}`,
        {
            name: name,
        }
    );

    return { success: true };
  },
});