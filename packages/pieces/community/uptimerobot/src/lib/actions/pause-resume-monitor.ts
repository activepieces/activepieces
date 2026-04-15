import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenMonitor,
  monitorDropdown,
  uptimeRobotApiCall,
  UptimeRobotEditMonitorResponse,
  UptimeRobotMonitorsResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const pauseResumeMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'pause_resume_monitor',
  displayName: 'Pause or Resume Monitor',
  description: 'Temporarily pause or resume monitoring for a specific monitor',
  props: {
    monitor: monitorDropdown,
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'Pause stops all checks and alerts. Resume restarts monitoring from where it left off.',
      required: true,
      options: {
        options: [
          { label: 'Pause', value: 0 },
          { label: 'Resume', value: 1 },
        ],
      },
    }),
  },
  async run(context) {
    const { monitor: monitorId, action: statusValue } = context.propsValue;

    const edited = await uptimeRobotApiCall<UptimeRobotEditMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'editMonitor',
      body: {
        id: monitorId,
        status: statusValue,
      },
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
