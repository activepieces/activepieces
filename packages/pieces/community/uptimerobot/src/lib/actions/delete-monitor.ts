import { createAction } from '@activepieces/pieces-framework';
import {
  monitorDropdown,
  uptimeRobotApiCall,
  UptimeRobotDeleteMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const deleteMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'delete_monitor',
  displayName: 'Delete Monitor',
  description: 'Permanently delete a monitor from UptimeRobot',
  props: {
    monitor: monitorDropdown,
  },
  async run(context) {
    const monitorId = context.propsValue.monitor;

    await uptimeRobotApiCall<UptimeRobotDeleteMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'deleteMonitor',
      body: { id: monitorId },
    });

    return { id: monitorId, deleted: true };
  },
});
