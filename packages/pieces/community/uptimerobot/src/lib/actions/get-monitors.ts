import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, flattenMonitor } from '../common';

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
    const baseBody: Record<string, unknown> = {};

    const statuses = context.propsValue.statuses;
    if (statuses && statuses.length > 0) {
      baseBody['statuses'] = (statuses as string[]).join('-');
    }

    if (context.propsValue.search) {
      baseBody['search'] = context.propsValue.search;
    }

    const allMonitors: Array<Record<string, unknown>> = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const response = await uptimeRobotApiCall<{
        stat: string;
        monitors: Array<Record<string, unknown>>;
        pagination: { offset: number; limit: number; total: number };
      }>({
        apiKey: context.auth as unknown as string,
        endpoint: 'getMonitors',
        body: { ...baseBody, offset, limit },
      });

      if (response.body.stat !== 'ok') {
        throw new Error(`UptimeRobot API error: ${JSON.stringify(response.body)}`);
      }

      const monitors = response.body.monitors ?? [];
      allMonitors.push(...monitors);

      const pagination = response.body.pagination;
      if (!pagination || offset + limit >= pagination.total) {
        break;
      }
      offset += limit;
    }

    return allMonitors.map((m) => flattenMonitor(m as never));
  },
});
