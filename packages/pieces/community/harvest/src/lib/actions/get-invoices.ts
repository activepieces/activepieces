import { Property, createAction } from "@activepieces/pieces-framework";
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
} from '@activepieces/pieces-common';
import { callHarvestApi } from '../common';

export const getInvoices = createAction({
  name: 'get_invoices', // Must be a unique across the piece, this shouldn't be changed.
  auth: harvestAuth,
  displayName: 'Get Invoices',
  description: 'Fetches invoices',
  props: {
    from_prop: Property.ShortText({
      description: 'Only return invoices with an issue_date on or after the given date. (YYYY-MM-DD)',
      displayName: 'From',
      required: false,
    }),
  },
  async run(context) {
    const { from_prop } = context.propsValue;
    const response = await callHarvestApi(
        HttpMethod.GET,
        `invoices`,
        getAccessTokenOrThrow(context.auth),
        { 
          from: `${from_prop}`, 
          per_page: '2000' 
        }
      );
  
      return response.body;  },
});

