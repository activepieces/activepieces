import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, savvyCalPaginatedCall, flattenEvent, SavvyCalEvent, SavvyCalSchedulingLink } from '../common';
import { savvyCalAuth } from '../../';

export const listEventsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_events',
  displayName: 'List Events',
  description: 'Returns a list of scheduled meetings from your SavvyCal account.',
  props: {
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'Filter events by their current status.',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    start_after: Property.DateTime({
      displayName: 'Start After',
      description: 'Only return events that start after this date and time.',
      required: false,
    }),
    start_before: Property.DateTime({
      displayName: 'Start Before',
      description: 'Only return events that start before this date and time.',
      required: false,
    }),
    link_id: Property.Dropdown({
      auth:savvyCalAuth,
      displayName: 'Scheduling Link',
      description: 'Only return events booked through a specific scheduling link. Leave empty for all links.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({
            token: auth as unknown as string,
            path: '/links',
          });
          return {
            disabled: false,
            options: links.map((l) => ({ label: `${l.name} (${l.slug})`, value: l.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of events to return. Leave empty to return all matching events.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const { state, start_after, start_before, link_id, limit } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (state) queryParams['state'] = state;
    if (start_after) queryParams['start_after'] = start_after;
    if (start_before) queryParams['start_before'] = start_before;
    if (link_id) queryParams['link_id'] = link_id;

    if (limit) {
      queryParams['limit'] = String(limit);
      const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
        token,
        method: HttpMethod.GET,
        path: '/events',
        queryParams,
      });
      return response.body.entries.map(flattenEvent);
    }

    const events = await savvyCalPaginatedCall<SavvyCalEvent>({ token, path: '/events', queryParams });
    return events.map(flattenEvent);
  },
});
