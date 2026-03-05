import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knowbe4Auth } from '../auth';
import { knowbe4ApiRequest } from '../common';

export const getAccount = createAction({
  auth: knowbe4Auth,
  name: 'get_account',
  displayName: 'Get Account Info',
  description: 'Get your KnowBe4 account and subscription information',
  props: {},
  async run(context) {
    return await knowbe4ApiRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      endpoint: '/account',
    });
  },
});
