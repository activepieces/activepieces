import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const testRunMonitor = createAction({
  auth: pubrioAuth,
  name: 'test_run_monitor',
  displayName: 'Test Run Monitor',
  description: 'Perform a test run of a monitor',
  audience: 'both',
  aiMetadata: {
    description:
      'Trigger a one-off test execution of an existing monitor (by monitor_id) to verify its configuration and preview matching signals without waiting for the schedule. Not idempotent: each call performs a fresh processing run and may dispatch to the monitor destination. Use for validating a monitor setup, not for routine data retrieval.',
    idempotent: false,
  },
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
