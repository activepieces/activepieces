import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { Operation, instanceLogin, prepareHttpRequest } from '../common';
import { httpClient } from '@activepieces/pieces-common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const searchRecords = createAction({
  name: 'search_records',
  auth: vtigerAuth,
  displayName: 'Search Records',
  description: 'Search for a record.',
  props: {
    query: Property.LongText({
      displayName: 'query',
      description: `Enter the query to search for record new record`,
      required: true,
    })
  },
  async run({ propsValue, auth }) {
    const vtigerInstance = await instanceLogin(
      auth.instance_url,
      auth.username,
      auth.password
    );
    if (vtigerInstance === null) return;

    const httpRequest = prepareHttpRequest(
      auth.instance_url,
      vtigerInstance.sessionId ?? vtigerInstance.sessionName,
      'query' as Operation,
      propsValue
    );

    const response = await httpClient.sendRequest<Record<string, unknown>[]>(
      httpRequest
    );

    if ([200, 201].includes(response.status)) {
      return response.body;
    }

    return {
      error: 'Unexpected outcome!',
    };
  },
});
