import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenMonitor,
  uptimeRobotApiCall,
  uptimeRobotCommon,
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
    monitor: uptimeRobotCommon.monitorIdField,
    monitorDropdown: uptimeRobotCommon.monitorDropdownOptional,
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
    const { monitor, monitorDropdown, action: statusValue } = context.propsValue;
    const monitorId = monitor || monitorDropdown;

    if (!monitorId) {
      throw new Error('Please provide a Monitor ID or select a monitor from the dropdown');
    }

    const newStatus = Number(statusValue);

    await uptimeRobotApiCall<UptimeRobotEditMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'editMonitor',
      body: {
        id: Number(monitorId),
        status: newStatus,
      },
    });

    // Wait for UptimeRobot to propagate the status change
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'getMonitors',
      body: {
        monitors: monitorId,
        custom_uptime_ratios: '30',
        response_times: 1,
      },
    });

    const updated = data.monitors[0];
    if (!updated) {
      throw new Error('Monitor was updated but could not be retrieved');
    }

    return {
      ...flattenMonitor({ monitor: updated }),
      action_performed: newStatus === 0 ? 'paused' : 'resumed',
    };
  },
});
