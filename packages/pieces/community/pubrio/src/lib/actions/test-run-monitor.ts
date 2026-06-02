import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const testRunMonitor = createAction({
  auth: pubrioAuth,
  name: 'test_run_monitor',
  displayName: 'Test Run Monitor',
  description: 'Perform a test run of a monitor',
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
    tried_at: Property.ShortText({
      displayName: 'Tried At',
      required: false,
      description: 'Timestamp for the test run (ISO 8601)',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    if (context.propsValue.tried_at)
      body['tried_at'] = context.propsValue.tried_at;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/process/try',
      body
    );
  },
});
