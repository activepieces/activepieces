import { createAction, Property } from '@activepieces/pieces-framework';
import { clicdataAuth } from '../common/auth';
import { clicdataApiCall } from '../common/client';
import { clicdataCommonProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const insertRow = createAction({
  auth: clicdataAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Insert rows into a ClicData table (maximum 500 rows)',
  props: {
    table_id: clicdataCommonProps.table_id,
    data: Property.Json({
      displayName: 'Row Data',
      description: 'Array of objects representing rows to insert. Each object should have column names as keys. Maximum 500 rows.',
      required: true,
      defaultValue: [
        {
          "Column1": "value1",
          "Column2": "value2"
        }
      ],
    }),
    apiVersion: clicdataCommonProps.apiVersion,
  },
  async run(context) {
    const { table_id, data, apiVersion } = context.propsValue;

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of objects');
    }

    if (data.length > 500) {
      throw new Error('Maximum 500 rows allowed per request');
    }

    if (data.some(item => typeof item !== 'object' || item === null)) {
      throw new Error('Each row must be an object with column names as keys');
    }

    const response = await clicdataApiCall<{
      rows_inserted: number;
      rows_found: number;
    }>({
      method: HttpMethod.POST,
      path: `/data/${table_id}/insert`,
      auth: context.auth,
      body: {
        data: data,
      },
      apiVersion: apiVersion || undefined,
    });

    return response.result;
  },
});
