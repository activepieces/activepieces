import { createAction, Property } from '@activepieces/pieces-framework';
import { uptimeRobotAuth } from '../../';
import { uptimeRobotApiCall, flattenMonitor } from '../common';

export const getMonitorsAction = createAction({
  auth: uptimeRobotAuth,
  name: 'get_monitors',
  displayName: 'Get Monitors',
  description: 'Retrieves all monitors or a specific set of monitors from your UptimeRobot account',
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

    const response = await uptimeRobotApiCall<{
      stat: string;
      monitors: Array<Record<string, unknown>>;
      pagination: { offset: number; limit: number; total: number };
    }>({
      apiKey: context.auth as unknown as string,
      endpoint: 'getMonitors',
      body,
    });

    if (response.body.stat !== 'ok') {
      throw new Error(`UptimeRobot API error: ${JSON.stringify(response.body)}`);
    }

    return (response.body.monitors ?? []).map((m) => flattenMonitor(m as never));
  },
});
