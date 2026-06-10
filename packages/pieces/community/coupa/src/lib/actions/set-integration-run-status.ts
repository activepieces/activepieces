import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import { objectIdProperty } from '../common/props';
import { flattenRecord } from '../common/utils';

export const setIntegrationRunStatus = createAction({
  auth: coupaAuth,
  name: 'set_integration_run_status',
  displayName: 'Set Integration Run Status',
  description:
    'Updates an integration run status (`run`, `success`, `fail`, `pause`, or `pending`).',
  props: {
    integrationRunId: objectIdProperty,
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Running', value: 'run' },
          { label: 'Successful', value: 'success' },
          { label: 'Failed', value: 'fail' },
          { label: 'Paused', value: 'pause' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const result = await client.request<Record<string, unknown>>({
      method: HttpMethod.PUT,
      resourceUri: `/integration_runs/${propsValue.integrationRunId}/${propsValue.status}`,
    });
    return flattenRecord(result);
  },
});
