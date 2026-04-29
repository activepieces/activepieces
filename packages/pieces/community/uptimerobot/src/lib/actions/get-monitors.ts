import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotPaginatedCall, flattenMonitor } from '../common';

export const getMonitorsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_monitors',
  displayName: 'Get Monitors',
  description: 'Retrieves all monitors from your UptimeRobot account with automatic pagination',
  props: {
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Status',
      description: 'Only return monitors with these statuses. Leave empty to return all.',
      required: false,
      options: {
        options: [
          { label: 'Up', value: '2' },
          { label: 'Down', value: '9' },
          { label: 'Seems Down', value: '8' },
          { label: 'Paused', value: '0' },
          { label: 'Not Checked Yet', value: '1' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter monitors by name or URL (partial match)',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};

    const statuses = context.propsValue.statuses;
    if (statuses && statuses.length > 0) {
      body['statuses'] = (statuses as string[]).join('-');
    }

    if (context.propsValue.search) {
      body['search'] = context.propsValue.search;
    }

    const monitors = await uptimeRobotPaginatedCall<Record<string, unknown>>({
      apiKey: context.auth as unknown as string,
      endpoint: 'getMonitors',
      listKey: 'monitors',
      body,
    });

    return monitors.map((m) => flattenMonitor(m as never));
  },
});
