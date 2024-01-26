import {
  DynamicPropsValue,
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
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: `Select the mode of search for your records`,
      required: true,
      defaultValue: 'filter',
      options: {
        options: [
          { label: 'Filter', value: 'filter' },
          { label: 'Query', value: 'query' },
        ],
      },
    }),
    search: Property.DynamicProperties({
      displayName: 'Search Fields',
      description: 'Add new fields to be created in the new record',
      required: true,
      refreshers: ['search_by'],
      props: async ({ auth, search_by }) => {
        if (!auth || !search_by) {
          return {};
        }

        const fields: DynamicPropsValue = {};

        if ((search_by as unknown as string) === 'filter') {
          fields['filter'] = Property.DynamicProperties({
            displayName: 'filter',
            description: `Enter your filter criteria`,
            required: true,
            refreshers: ['search_by'],
            props: async ({ search_by }) => {
              console.debug('search_by', search_by);

              return {
                simple: Property.LongText({
                  displayName: 'query',
                  description: `Enter the query to search for record new record`,
                  required: true,
                }),
              } as DynamicPropsValue;
            },
          });
        } else {
          fields['query'] = Property.LongText({
            displayName: 'query',
            description: `Enter the query to search for record new record`,
            required: true,
          });
        }

        return fields;
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Enter the maximum number of records to return.',
      defaultValue: 100,
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

    const httpRequest = prepareHttpRequest(
      auth.instance_url,
      vtigerInstance.sessionId ?? vtigerInstance.sessionName,
      'query' as Operation,
      {}
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