import { createAction, Property } from '@activepieces/pieces-framework';
import {
  fetchAllMonitors,
  flattenMonitor,
  uptimeRobotCommon,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const getMonitorsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_monitors',
  displayName: 'Get Monitors',
  description: 'List and search your UptimeRobot monitors with optional filters',
  props: {
    monitorIds: Property.ShortText({
      displayName: 'Monitor IDs',
      description: 'Comma-separated monitor IDs or single ID from previous step (e.g. {{create_monitor.id}}). Leave empty to use dropdown or return all.',
      required: false,
    }),
    monitors: Property.MultiSelectDropdown({
      auth: uptimeRobotAuth,
      displayName: 'Or Select Monitors',
      description:
        'Search and select specific monitors. Ignored if Monitor IDs above is provided.',
      required: false,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your UptimeRobot account first',
          };
        }

        const additionalBody: Record<string, unknown> = {};
        if (searchValue) {
          additionalBody['search'] = searchValue;
        }

        try {
          const monitors = await fetchAllMonitors({
            apiKey: auth.secret_text,
            additionalBody,
          });

          if (monitors.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: searchValue
                ? 'No monitors match your search'
                : 'No monitors found in your account',
            };
          }

          return {
            disabled: false,
            options: monitors.map((m) => {
              const statusLabel =
                uptimeRobotCommon.MONITOR_STATUS_MAP[m.status] ?? String(m.status);
              return {
                label: `${m.friendly_name} (${m.url}) — ${statusLabel}`,
                value: String(m.id),
              };
            }),
          };
        } catch (error) {
          console.error('Failed to fetch monitors for search:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load monitors. Check your API key.',
          };
        }
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Monitor Type',
      description: 'Only return monitors of this type. Leave empty for all types.',
      required: false,
      options: {
        options: [
          { label: 'HTTP', value: 1 },
          { label: 'Keyword', value: 2 },
          { label: 'Ping', value: 3 },
          { label: 'Port', value: 4 },
          { label: 'Heartbeat', value: 5 },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return monitors with this status. Leave empty for all statuses.',
      required: false,
      options: {
        options: [
          { label: 'Up', value: '2' },
          { label: 'Down', value: '9' },
          { label: 'Paused', value: '0' },
          { label: 'Seems down', value: '8' },
          { label: 'Not checked yet', value: '1' },
        ],
      },
    }),
  },
  async run(context) {
    const { monitorIds, monitors: selectedMonitorIds, type, status } = context.propsValue;

    const additionalBody: Record<string, unknown> = {
      custom_uptime_ratios: '30',
      response_times: 1,
    };

    // Priority: monitorIds field > dropdown selection
    if (monitorIds) {
      // Support comma-separated IDs: "123,456,789" or single ID
      additionalBody['monitors'] = monitorIds.replace(/,/g, '-').trim();
    } else if (selectedMonitorIds && selectedMonitorIds.length > 0) {
      additionalBody['monitors'] = selectedMonitorIds.join('-');
    }
    if (type !== undefined && type !== null) {
      additionalBody['types'] = String(type);
    }
    if (status !== undefined && status !== null) {
      additionalBody['statuses'] = status;
    }

    const monitors = await fetchAllMonitors({
      apiKey: context.auth.secret_text,
      additionalBody,
    });

    return monitors.map((monitor) => flattenMonitor({ monitor }));
  },
});
