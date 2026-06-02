import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotCommon, UptimeRobotNewMonitorResponse } from '../common';
import { uptimeRobotAuth } from '../auth';

export const createMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'create_monitor',
  displayName: 'Create HTTP Monitor',
  description: 'Create a new HTTP uptime monitor in UptimeRobot',
  props: {
    friendly_name: Property.ShortText({
      displayName: 'Monitor Name',
      description: "A name for this monitor (e.g. 'Company Website' or 'API Server')",
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        "The full URL to monitor, including the protocol (e.g. 'https://example.com').",
      required: true,
    }),
    interval: Property.Number({
      displayName: 'Check Interval (seconds)',
      description:
        'How often UptimeRobot checks this URL, in seconds. Minimum 300s (5 min) on the Free plan, 60s on Solo/Team, 30s on Enterprise.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { friendly_name, url, interval } = context.propsValue;

    const body: Record<string, unknown> = { friendly_name, url, type: 1 };
    if (interval !== undefined && interval !== null) body['interval'] = interval;

    const created = await uptimeRobotCommon.apiCall<UptimeRobotNewMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'newMonitor',
      body,
    });

    const flat = await uptimeRobotCommon.fetchFlatMonitorById({
      apiKey: context.auth.secret_text,
      id: created.monitor.id,
    });
    if (!flat) {
      throw new Error('Monitor was created but could not be retrieved.');
    }
    return flat;
  },
});
