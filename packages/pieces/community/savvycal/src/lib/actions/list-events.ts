import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, savvyCalPaginatedCall, flattenEvent, buildTeamOptions, buildLinkOptions, SavvyCalEvent } from '../common';
import { savvyCalAuth } from '../../';

export const listEventsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_events',
  displayName: 'List Events',
  description: 'Returns a list of scheduled meetings from your SavvyCal account.',
  props: {
    states: Property.StaticMultiSelectDropdown({
      displayName: 'State',
      description: 'Filter events by their current status. Leave empty to return all statuses.',
      required: false,
      options: {
        options: [
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
    team_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Filter scheduling links by team. Leave empty to show all teams.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamOptions(auth.secret_text);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
    link_ids: Property.MultiSelectDropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Links',
      description: 'Only return events booked through the selected scheduling links. Leave empty for all links.',
      refreshers: ['team_id'],
      required: false,
      options: async ({ auth, team_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildLinkOptions(auth.secret_text, team_id as string | null);
          return { disabled: false, options };
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
    const { states, start_after, start_before, link_ids, limit } = context.propsValue;

    const selectedStates = states as string[] | undefined;
    const selectedLinkIds = link_ids as string[] | undefined;
    const hasLinkFilter = selectedLinkIds && selectedLinkIds.length > 0;
    const needsClientFilter = (hasLinkFilter && selectedLinkIds.length > 1) || (selectedStates && selectedStates.length > 1);

    const queryParams: Record<string, string> = {};
    if (start_after) queryParams['start_after'] = start_after;
    if (start_before) queryParams['start_before'] = start_before;

    if (selectedStates && selectedStates.length === 1) {
      queryParams['state'] = selectedStates[0];
    }
    if (hasLinkFilter && selectedLinkIds.length === 1 && !(selectedStates && selectedStates.length > 1)) {
      queryParams['link_id'] = selectedLinkIds[0];
    }

    let events: SavvyCalEvent[];
    if (limit && !needsClientFilter) {
      queryParams['limit'] = String(limit);
      const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
        token,
        method: HttpMethod.GET,
        path: '/events',
        queryParams,
      });
      events = response.body.entries;
    } else {
      events = await savvyCalPaginatedCall<SavvyCalEvent>({ token, path: '/events', queryParams });
    }

    const filtered = events
      .filter((e) => !selectedStates || selectedStates.length === 0 || selectedStates.includes(e.state))
      .filter((e) => !hasLinkFilter || selectedLinkIds.includes(e.link?.id ?? ''));

    return (limit ? filtered.slice(0, limit) : filtered).map(flattenEvent);
  },
});
