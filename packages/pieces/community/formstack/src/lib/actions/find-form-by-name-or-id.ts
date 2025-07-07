import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


export const findFormByNameOrId = createAction({
  auth: formStackAuth,
  name: 'findFormByNameOrId',
  displayName: 'Find Form by Name or ID',
  description: 'Locate a specific form for submissions or updates.',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search  by Name or id',
      description: 'Search by Name or id',
      required: true,
    }),

  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    const { search_query } = context.propsValue
    const queryParams = { search_query }

    const response = await makeRequest(
      accessToken,
      HttpMethod.GET,
      `/forms.json`,
      {},
      queryParams
    );
    return response;
  },
});
