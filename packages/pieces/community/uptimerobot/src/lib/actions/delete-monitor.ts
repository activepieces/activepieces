import { createAction } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, monitorDropdown } from '../common';

export const deleteMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'delete_monitor',
  displayName: 'Delete Monitor',
  description: 'Permanently deletes a monitor from your UptimeRobot account',
  props: {
    monitor: monitorDropdown,
  },
  async run(context) {
    const response = await uptimeRobotApiCall<{
      stat: string;
      monitor: { id: number };
    }>({
      apiKey: context.auth as unknown as string,
      endpoint: 'deleteMonitor',
      body: {
        id: Number(context.propsValue.monitor),
      },
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`Failed to delete monitor: ${JSON.stringify(response.body)}`);
    }

    return {
      id: response.body.monitor.id,
      deleted: true,
    };
  },
});
