import { QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { extensivAuth } from '../lib/auth';
import { ExtensivClient } from '../lib/common';
import { ExtensivCredentials } from '../lib/types';

export const getCustomersAction = createAction({
  auth: extensivAuth,
  name: 'get_customers',
  displayName: 'Get Customers',
  description: 'Retrieve customers from Extensiv.',

  props: {
    facilityid: Property.Number({
      displayName: 'Facility ID',
      description: 'Optional facility identifier.',
      required: false,
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

    const { facilityid, rql, pgsiz, pgnum, sort } = context.propsValue;

    const queryParams: QueryParams = {};

    if (facilityid !== undefined) {
      queryParams['facilityid'] = String(facilityid);
    }

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

    return client.getCustomers(queryParams);
  },
});