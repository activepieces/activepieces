import { createAction } from '@activepieces/pieces-framework';
import {
  uptimeRobotApiCall,
  uptimeRobotCommon,
  UptimeRobotDeleteMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const deleteMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'delete_monitor',
  displayName: 'Delete Monitor',
  description: 'Permanently delete a monitor from UptimeRobot',
  props: {
    monitor: uptimeRobotCommon.monitorIdField,
    monitorDropdown: uptimeRobotCommon.monitorDropdownOptional,
  },
  async run(context) {
    const { monitor, monitorDropdown } = context.propsValue;
    const monitorId = monitor || monitorDropdown;

    if (!monitorId) {
      throw new Error('Please provide a Monitor ID or select a monitor from the dropdown');
    }

    await uptimeRobotApiCall<UptimeRobotDeleteMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'deleteMonitor',
      body: { id: monitorId },
    });

    return { id: monitorId, deleted: true };
  },
});
