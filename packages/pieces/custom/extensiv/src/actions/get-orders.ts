import { QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { extensivAuth } from '../lib/auth';
import { ExtensivClient } from '../lib/common';
import { ExtensivCredentials } from '../lib/types';

export const getOrdersAction = createAction({
  auth: extensivAuth,
  name: 'get_orders',
  displayName: 'Get Orders',
  description: 'Retrieve orders from Extensiv.',

  props: {
    rql: Property.ShortText({
      displayName: 'RQL Filter',
      description: 'Optional RQL filter expression.',
      required: false,
    }),

    pgsiz: Property.Number({
      displayName: 'Page Size',
      description: 'Number of records per page.',
      required: false,
    }),

    pgnum: Property.Number({
      displayName: 'Page Number',
      description: 'Page number.',
      required: false,
    }),

    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Sort expression.',
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

    const { rql, pgsiz, pgnum, sort } = context.propsValue;

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

    return client.getOrders(queryParams);
  },
});