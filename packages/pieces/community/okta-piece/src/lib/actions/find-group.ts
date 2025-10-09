import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const findGroup = createAction({
  auth: oktaAuth,
  name: 'find_group',
  displayName: 'Find Group',
  description: 'Search for Okta groups by name, type, or other criteria',
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      required: true,
      options: {
        options: [
          { label: 'By Name', value: 'name' },
          { label: 'By ID', value: 'id' },
          { label: 'By Type', value: 'type' },
          { label: 'Simple Query', value: 'query' },
        ],
      },
      defaultValue: 'name',
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 200, max: 10000)',
      required: false,
      defaultValue: 200,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { searchType, searchValue, limit } = context.propsValue;

    let url = `https://${domain}/api/v1/groups`;
    const params: string[] = [];

    if (limit) {
      params.push(`limit=${limit}`);
    }

    switch (searchType) {
      case 'name':
        const nameQuery = encodeURIComponent(`profile.name eq "${searchValue}"`);
        params.push(`search=${nameQuery}`);
        break;
      case 'id':
        const idQuery = encodeURIComponent(`id eq "${searchValue}"`);
        params.push(`search=${idQuery}`);
        break;
      case 'type':
        const typeQuery = encodeURIComponent(`type eq "${searchValue}"`);
        params.push(`search=${typeQuery}`);
        break;
      case 'query':
        params.push(`q=${encodeURIComponent(searchValue)}`);
        break;
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
    });

    return response.body;
  },
});
