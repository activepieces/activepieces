import { createAction, Property } from '@activepieces/pieces-framework';
import { messariAuth } from '../../index';
import { messariRequest } from '../common/messari-api';

export const getAllAssets = createAction({
  auth: messariAuth,
  name: 'get_all_assets',
  displayName: 'Get All Assets',
  description: 'List all tracked crypto assets with market data. Supports pagination and field filtering.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of assets per page (default: 20, max: 500)',
      required: false,
      defaultValue: 20,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort assets by this field',
      required: false,
      options: {
        options: [
          { label: 'Market Cap (desc)', value: 'marketcap/rank' },
          { label: 'ID', value: 'id' },
          { label: 'Symbol', value: 'symbol' },
          { label: 'Name', value: 'name' },
        ],
      },
      defaultValue: 'marketcap/rank',
    }),
  },
  async run(context) {
    const params: Record<string, string | number | undefined> = {};
    if (context.propsValue.page) params['page'] = context.propsValue.page;
    if (context.propsValue.limit) params['limit'] = context.propsValue.limit;
    if (context.propsValue.sort) params['sort'] = context.propsValue.sort;
    return messariRequest(context.auth, 'v2', '/assets', params);
  },
});
