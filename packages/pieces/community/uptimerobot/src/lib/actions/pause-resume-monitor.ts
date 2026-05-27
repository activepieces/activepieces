import { createAction, Property } from '@activepieces/pieces-framework';
import {
  uptimeRobotCommon,
  UptimeRobotEditMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const pauseResumeMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'pause_resume_monitor',
  displayName: 'Pause or Resume Monitor',
  description: 'Temporarily pause or resume monitoring for a specific monitor.',
  props: {
    monitor: uptimeRobotCommon.monitorDropdownOptional,
    monitor_id_override: Property.ShortText({
      displayName: 'Or Enter Monitor ID',
      description:
        'Use this to pass a dynamic Monitor ID from a previous step. If set, this overrides the dropdown selection above.',
      required: false,
    }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description:
        'Pause stops all checks and alerts. Resume restarts monitoring.',
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
    const { monitor, monitor_id_override } = context.propsValue;
    const overrideId =
      typeof monitor_id_override === 'string' ? monitor_id_override.trim() : '';
    const monitorId = overrideId.length > 0 ? overrideId : monitor;

    if (!monitorId) {
      throw new Error('Please select a monitor or enter a Monitor ID.');
    }
    const newStatus = Number(context.propsValue.action);
    await uptimeRobotCommon.apiCall<UptimeRobotEditMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'editMonitor',
      body: { id: Number(monitorId), status: newStatus },
    });
    const flat = await uptimeRobotCommon.fetchFlatMonitorById({
      apiKey: context.auth.secret_text,
      id: monitorId,
    });
    if (!flat) {
      throw new Error('Monitor status changed but could not be retrieved.');
    }
    return {
      ...flat,
      action_performed: newStatus === 0 ? 'paused' : 'resumed',
    };
  },
});
