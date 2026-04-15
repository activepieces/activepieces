import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenMonitor,
  uptimeRobotApiCall,
  UptimeRobotMonitorsResponse,
} from '../common';
import { uptimeRobotAuth } from '../auth';

export const getMonitorsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_monitors',
  displayName: 'Get Monitors',
  description: 'List and search your UptimeRobot monitors with optional filters',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter monitors by name or URL. Leave empty to return all monitors.',
      required: false,
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
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return monitors with this status. Leave empty for all statuses.',
      required: false,
      options: {
        options: [
          { label: 'Up', value: 2 },
          { label: 'Down', value: 9 },
          { label: 'Paused', value: 0 },
        ],
      },
    }),
  },
  async run(context) {
    const { search, type, status } = context.propsValue;

    const body: Record<string, unknown> = {
      limit: 50,
      offset: 0,
      custom_uptime_ratios: '30',
      response_times: 1,
    };

    if (search) body['search'] = search;
    if (type !== undefined && type !== null) body['type'] = type;
    if (status !== undefined && status !== null) body['statuses'] = status;

    const data = await uptimeRobotApiCall<UptimeRobotMonitorsResponse>({
      apiKey: context.auth.secret_text,
      endpoint: 'getMonitors',
      body,
    });

    return data.monitors.map((monitor) => flattenMonitor({ monitor }));
  },
});
