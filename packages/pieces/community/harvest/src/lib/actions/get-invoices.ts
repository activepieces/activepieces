import { Property, createAction, DynamicPropsValue } from "@activepieces/pieces-framework";
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
    from: Property.ShortText({
      description: 'Only return invoices with an issue_date on or after the given date. (YYYY-MM-DD)',
      displayName: 'From',
      required: false,
    }),
    to: Property.ShortText({
      description: 'Only return invoices with an issue_date on or before the given date. (YYYY-MM-DD)',
      displayName: 'To',
      required: false,
    }),
    state: Property.ShortText({
      description: 'Only return invoices with a state matching the value provided. Options: draft, open, paid, or closed.',
      displayName: 'State',
      required: false,
    }),    
    updated_since: Property.ShortText({
      description: 'Only return invoices that have been updated since the given date and time.',
      displayName: 'Updated since',
      required: false,
    }),    
    client_id: Property.ShortText({
      description: 'Only return invoices belonging to the client with the given ID.',
      displayName: 'Client Id',
      required: false,
    }),
    project_id: Property.Number({
      description: 'Only return invoices belonging to the project with the given ID.',
      displayName: 'Project Id',
      required: false,
    }),
    page: Property.Number({
      description: 'The page number to use in pagination.',
      displayName: 'Page',
      required: false,
    }),
    per_page: Property.Number({
      description: 'The number of records to return per page.',
      displayName: 'Records per page',
      required: false,
    }),

  },
  async run(context) {
//    const { from, to, state, updated_since, client_id, project_id, page, per_page } = context.propsValue;
    const { propsValue } = context;
    const params: DynamicPropsValue = {};

    const dynamicFields: DynamicPropsValue = context.propsValue;
    const fields: {
      [n: string]: string;
    } = {};

    const props = Object.entries(dynamicFields);
    for (const [propertyKey, propertyValue] of props) {
  
      if (propertyValue === null || propertyValue === undefined) {
        continue;
      }

  
      if (propertyValue !== undefined && propertyValue !== '' && !(typeof propertyValue === 'string' && propertyValue.trim() === '')) {
        fields[propertyKey] = propertyValue;
      }
    }

    const response = await callHarvestApi(
        HttpMethod.GET,
        `invoices`,
        getAccessTokenOrThrow(context.auth),
        fields
/*        { 
          from: `${from}`, 
          to: `${to}`, 
          state: `${state}`, 
          updated_since: `${updated_since}`, 
          client_id: `${client_id}`, 
          project_id: `${project_id}`, 
          page: `${page}`, 
          per_page: `${per_page}` 
        }
*/
      );
  
      return response.body;  },
});

