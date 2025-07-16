import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteLink = createAction({
  auth: shortioAuth,
  name: 'delete_link',
  displayName: 'Delete Link',
  description: 'Permanently delete a short link from Short.io',
  props: {
    domain_id: shortioCommon.domain_id,
    link_id: shortioCommon.link_id,
  },
  async run({ auth, propsValue }) {
    const props = propsValue;

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.DELETE,
      resourceUri: `/links/${props.link_id}`,
    });

    return response;
  },
});
