import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { table } from 'console';

export const findDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'findDatabaseRecord',
  displayName: 'Find Database Record',
  description:
    'Search for records in a Softr database table based on filter criteria',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    filter: Property.Object({
      displayName: 'Filter',
      description:
        'Filter conditions to search records. Leave empty to return all records.',
      required: false,
    }),
    sort: Property.Object({
      displayName: 'Sort',
      description: 'Sort configuration for the results',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const { databaseId, tableId, filter, sort, offset, limit } = propsValue;

    const requestBody: any = {
      paging: {
        offset: offset || 0,
        limit: limit || 10,
      },
    };

    if (filter) {
      requestBody.filter = filter;
    }

    if (sort) {
      requestBody.sort = sort;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/databases/${databaseId}/tables/${tableId}/records/search`,
      requestBody
    );

    return response;
  },
});
