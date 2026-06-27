import { QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { extensivAuth } from '../lib/auth';
import { ExtensivClient } from '../lib/common';
import { ExtensivCredentials } from '../lib/types';

export const getItemsAction = createAction({
  auth: extensivAuth,
  name: 'get_items',
  displayName: 'Get Items',
  description: 'Retrieve items for a customer from Extensiv.',

  props: {
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'The Extensiv customer ID.',
      required: true,
    }),

    rql: Property.ShortText({
      displayName: 'RQL Filter',
      description: 'Optional RQL filter.',
      required: false,
    }),

    pgsiz: Property.Number({
      displayName: 'Page Size',
      required: false,
    }),

    pgnum: Property.Number({
      displayName: 'Page Number',
      required: false,
    }),

    sort: Property.ShortText({
      displayName: 'Sort',
      required: false,
    }),
  },

  async run(context) {
    const auth: ExtensivCredentials = {
      baseUrl: context.auth.props.baseUrl,
      clientId: context.auth.props.clientId,
      clientSecret: context.auth.props.clientSecret,
      userLogin: context.auth.props.userLogin,
    };

    const client = new ExtensivClient(auth);

    const { customerId, rql, pgsiz, pgnum, sort } = context.propsValue;

    const queryParams: QueryParams = {};

    if (rql) {
      queryParams['rql'] = rql;
    }

    if (pgsiz !== undefined) {
      queryParams['pgsiz'] = String(pgsiz);
    }

    if (pgnum !== undefined) {
      queryParams['pgnum'] = String(pgnum);
    }

    if (sort) {
      queryParams['sort'] = sort;
    }

    return client.getItems(customerId, queryParams);
  },
});