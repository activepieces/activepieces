import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenMonitor,
  monitorDropdown,
  uptimeRobotApiCall,
  UptimeRobotEditMonitorResponse,
  UptimeRobotMonitorsResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const editMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'edit_monitor',
  displayName: 'Edit Monitor',
  description: 'Update the settings of an existing UptimeRobot monitor',
  props: {
    monitor: monitorDropdown,
    friendly_name: Property.ShortText({
      displayName: 'New Monitor Name',
      description: "Update the name of this monitor (e.g. 'Company Website v2'). Leave empty to keep the current name.",
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'New URL or IP Address',
      description: "Update the URL or IP address being monitored. Leave empty to keep the current URL.",
      required: false,
    }),
    interval: Property.Number({
      displayName: 'New Check Interval (seconds)',
      description: 'Update how often UptimeRobot checks this target. Minimum 60s on Free plan. Leave empty to keep the current interval.',
      required: false,
    }),
  },
  async run(context) {
    const { monitor: monitorId, friendly_name, url, interval } = context.propsValue;

    const body: Record<string, unknown> = {
      id: monitorId,
    };

    // Only send fields the user filled in — empty fields would overwrite current values
    if (friendly_name) body['friendly_name'] = friendly_name;
    if (url) body['url'] = url;
    if (interval !== undefined && interval !== null) body['interval'] = interval;

    const edited = await uptimeRobotApiCall<UptimeRobotEditMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'editMonitor',
      body,
    });

    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'getMonitors',
      body: {
        monitors: String(edited.monitor.id),
        custom_uptime_ratios: '30',
        response_times: 1,
      },
    });

    const updated = data.monitors[0];
    if (!updated) {
      throw new Error('Monitor was updated but could not be retrieved');
    }

    return flattenMonitor({ monitor: updated });
  },
});
