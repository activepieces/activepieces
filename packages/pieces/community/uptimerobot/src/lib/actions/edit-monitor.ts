import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, monitorDropdown } from '../common';

export const editMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'edit_monitor',
  displayName: 'Edit Monitor',
  description: 'Updates an existing monitor\'s settings',
  props: {
    monitor: monitorDropdown,
    friendly_name: Property.ShortText({
      displayName: 'New Monitor Name',
      description: 'Leave empty to keep the current name',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'New URL or IP',
      description: 'Leave empty to keep the current URL',
      required: false,
    }),
    interval: Property.Number({
      displayName: 'New Check Interval (seconds)',
      description: 'Leave empty to keep the current interval',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Pause or resume the monitor',
      required: false,
      options: {
        options: [
          { label: 'Resume (start checking)', value: '1' },
          { label: 'Pause (stop checking)', value: '0' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      id: Number(context.propsValue.monitor),
    };

    if (context.propsValue.friendly_name) {
      body['friendly_name'] = context.propsValue.friendly_name;
    }
    if (context.propsValue.url) {
      body['url'] = context.propsValue.url;
    }
    if (context.propsValue.interval) {
      body['interval'] = context.propsValue.interval;
    }
    if (context.propsValue.status) {
      body['status'] = Number(context.propsValue.status);
    }

    const response = await uptimeRobotApiCall<{
      stat: string;
      monitor: { id: number };
    }>({
      apiKey: context.auth as unknown as string,
      endpoint: 'editMonitor',
      body,
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`Failed to edit monitor: ${JSON.stringify(response.body)}`);
    }

    return {
      id: response.body.monitor.id,
      updated: true,
    };
  },
});
