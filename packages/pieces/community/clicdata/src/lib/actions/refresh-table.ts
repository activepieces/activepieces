import { createAction, Property } from '@activepieces/pieces-framework';
import { clicdataAuth } from '../common/auth';
import { clicdataApiCall } from '../common/client';
import { clicdataCommonProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const refreshTable = createAction({
  auth: clicdataAuth,
  name: 'refresh_table',
  displayName: 'Refresh Table',
  description: 'Refresh the selected table depending on the refresh mode',
  props: {
    table_id: clicdataCommonProps.table_id,
    mode: Property.StaticDropdown({
      displayName: 'Refresh Mode',
      description: 'Select the refresh mode for the table',
      required: true,
      options: {
        options: [
          {
            label: 'Reload',
            value: 'reload',
          },
          {
            label: 'Rebuild',
            value: 'rebuild',
          },
          {
            label: 'Update',
            value: 'update',
          },
          {
            label: 'Append',
            value: 'append',
          },
          {
            label: 'Update + Append',
            value: 'updateappend',
          },
        ],
      },
      defaultValue: 'reload',
    }),
    apiVersion: clicdataCommonProps.apiVersion,
  },
  async run(context) {
    const { table_id, mode, apiVersion } = context.propsValue;

    const response = await clicdataApiCall<{
      success: boolean;
    }>({
      method: HttpMethod.POST,
      path: `/table/${table_id}/refresh`,
      auth: context.auth,
      body: {
        mode: mode,
      },
      apiVersion: apiVersion || '2025.3',
    });

    return response.result;
  },
});
