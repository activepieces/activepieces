import { createAction, Property } from '@activepieces/pieces-framework';
import {
  uptimeRobotCommon,
  UptimeRobotEditMonitorResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const editMonitorAction = createAction({
  auth: uptimeRobotAuth,
  name: 'edit_monitor',
  displayName: 'Edit Monitor',
  description: 'Update the settings of an existing UptimeRobot monitor',
  props: {
    monitor: uptimeRobotCommon.monitorDropdownOptional,
    monitor_id_override: Property.ShortText({
      displayName: 'Or Enter Monitor ID',
      description:
        'Use this to pass a dynamic Monitor ID from a previous step (e.g. {{create_monitor.id}}). If set, this overrides the dropdown selection above.',
      required: false,
    }),
    friendly_name: Property.ShortText({
      displayName: 'New Monitor Name',
      description:
        "Update the monitor's name. Leave empty to keep the current name.",
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'New URL or IP Address',
      description:
        'Update the URL or IP being monitored. Leave empty to keep the current value.',
      required: false,
    }),
    interval: Property.Number({
      displayName: 'New Check Interval (seconds)',
      description:
        'Minimum 60s on Free plan, 30s on Pro. Values below the plan minimum are rejected by UptimeRobot. Leave empty to keep the current interval.',
      required: false,
    }),
  },
  async run(context) {
    const { monitor, monitor_id_override, friendly_name, url, interval } =
      context.propsValue;
    const overrideId =
      typeof monitor_id_override === 'string' ? monitor_id_override.trim() : '';
    const monitorId = overrideId.length > 0 ? overrideId : monitor;

    if (!monitorId) {
      throw new Error('Please select a monitor or enter a Monitor ID.');
    }

    const body: Record<string, unknown> = { id: monitorId };
    if (friendly_name) body['friendly_name'] = friendly_name;
    if (url) body['url'] = url;
    if (interval !== undefined && interval !== null) body['interval'] = interval;

    const edited =
      await uptimeRobotCommon.apiCall<UptimeRobotEditMonitorResponse>({
        apiKey: context.auth.secret_text,
        endpoint: 'editMonitor',
        body,
      });

    const flat = await uptimeRobotCommon.fetchFlatMonitorById({
      apiKey: context.auth.secret_text,
      id: edited.monitor.id,
    });
    if (!flat) {
      throw new Error('Monitor was updated but could not be retrieved.');
    }
    return flat;
  },
});
