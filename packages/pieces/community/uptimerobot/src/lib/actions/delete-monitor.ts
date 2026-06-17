import { createAction, Property } from '@activepieces/pieces-framework';
import {
  uptimeRobotCommon,
  UptimeRobotDeleteMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const deleteMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'delete_monitor',
  displayName: 'Delete Monitor',
  description:
    'Permanently delete a monitor from UptimeRobot. This cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a UptimeRobot monitor, identified either by the dropdown selection or by a raw Monitor ID passed from a prior step (the raw ID overrides the dropdown). This is irreversible and destructive, so confirm the target before calling; repeating it on an already-deleted monitor will fail.',
    idempotent: false,
  },
  props: {
    monitor: uptimeRobotCommon.monitorDropdownOptional,
    monitor_id_override: Property.ShortText({
      displayName: 'Or Enter Monitor ID',
      description:
        'Use this to pass a dynamic Monitor ID from a previous step. If set, this overrides the dropdown selection above.',
      required: false,
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
    await uptimeRobotCommon.apiCall<UptimeRobotDeleteMonitorResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'deleteMonitor',
      body: { id: Number(monitorId) },
    });
    return { id: String(monitorId), deleted: true };
  },
});
