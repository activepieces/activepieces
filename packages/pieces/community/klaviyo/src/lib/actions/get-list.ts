import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';
import { listIdDropdown } from '../common/props';

export const getListAction = createAction({
  auth: klaviyoAuth,
  name: 'get_list',
  displayName: 'Get List',
  description: 'Retrieve details about a specific Klaviyo list.',
  props: {
    list_id: listIdDropdown,
  },
  async run(context) {
    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: `/lists/${context.propsValue.list_id}`,
    });
  },
});
