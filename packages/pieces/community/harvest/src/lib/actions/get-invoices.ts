import { createAction } from '@activepieces/pieces-framework';
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
  props: {},
  async run(context) {
//      const { list_id } = context.propsValue;
      const response = await callHarvestApi(
        HttpMethod.GET,
        `invoices`,
        getAccessTokenOrThrow(context.auth),
        { 
          from: '2024-06-06', 
          per_page: '2000' 
        }
      );
  
      return response.body;  },
});

