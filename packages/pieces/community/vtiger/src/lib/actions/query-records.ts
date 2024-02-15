import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import {
  Operation,
  elementTypeProperty,
  instanceLogin,
  prepareHttpRequest,
} from '../common';
import { httpClient } from '@activepieces/pieces-common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const queryRecords = createAction({
  name: 'query_records',
  auth: vtigerAuth,
  displayName: 'Query Records',
  description: 'Query records by SQL statement.',
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Enter the query statement, e.g. SELECT count(*) FROM Contacts;',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const vtigerInstance = await instanceLogin(
      auth.instance_url,
      auth.username,
      auth.password
    );
    if (vtigerInstance === null) return;

    const response = await httpClient.sendRequest<{
      success: boolean;
      result: Record<string, unknown>[];
    }>(
      prepareHttpRequest(
        auth.instance_url,
        vtigerInstance.sessionId ?? vtigerInstance.sessionName,
        'query' as Operation,
        { query: propsValue.query }
      )
    );

    if (response.body.success) {
      return response.body.result;
    } else {
      console.debug(response);

      return {
        error: 'Unexpected outcome!',
      };
    }
  },
});
