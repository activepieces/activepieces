import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotCommon } from '../common';
import { uptimeRobotAuth } from '../auth';

export const getMonitorsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_monitors',
  displayName: 'Get Monitors',
  description:
    'List and search your UptimeRobot monitors with optional filters. Leave the Monitors / Monitor IDs fields empty to return all monitors.',
  props: {
    monitor_ids: uptimeRobotCommon.monitorMultiSelect,
    monitor_ids_csv: Property.ShortText({
      displayName: 'Or Enter Monitor IDs (comma-separated)',
      description:
        'Use this to pass dynamic Monitor IDs from a previous step (e.g. "123, 456"). Merged with any selections above.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Monitor Type',
      description:
        'Only HTTP monitors are supported at the moment. Other UptimeRobot types (Keyword, Ping, Port, Heartbeat) will be added in a future release. Leave empty to return monitors of all types.',
      required: false,
      options: {
        options: [{ label: 'HTTP', value: 1 }],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        'Only return monitors with this status. Leave empty for all statuses.',
      required: false,
      options: {
        options: [
          { label: 'Up', value: 2 },
          { label: 'Down', value: 9 },
          { label: 'Paused', value: 0 },
          { label: 'Seems down', value: 8 },
          { label: 'Not checked yet', value: 1 },
        ],
      },
    }),
  },
  async run(context) {
    const { monitor_ids, monitor_ids_csv, type, status } = context.propsValue;

    const additionalBody: Record<string, unknown> = {
      custom_uptime_ratios: '30',
      response_times: 1,
    };

    const selectedIds = Array.isArray(monitor_ids)
      ? monitor_ids.filter((v): v is string => typeof v === 'string')
      : [];
    const csvIds =
      typeof monitor_ids_csv === 'string'
        ? monitor_ids_csv
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];
    const allIds = Array.from(new Set([...selectedIds, ...csvIds]));
    if (allIds.length > 0) {
      additionalBody['monitors'] = allIds.join('-');
    }
    if (type !== undefined && type !== null) {
      additionalBody['types'] = String(type);
    }
    if (status !== undefined && status !== null) {
      additionalBody['statuses'] = String(status);
    }

    const monitors = await uptimeRobotCommon.fetchAllMonitors({
      apiKey: context.auth.secret_text,
      additionalBody,
    });
    return monitors.map((monitor) =>
      uptimeRobotCommon.flattenMonitor({ monitor }),
    );
  },
});
