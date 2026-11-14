import { createAction, Property } from '@activepieces/pieces-framework';
import { savvyCalCollect, buildEventQuery, flattenEvent, buildTeamOptions, buildLinkOptions, SavvyCalEvent } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const listEventsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_events',
  classification: 'SEARCH',
  displayName: 'List Events',
  description: 'Returns a list of scheduled meetings from your SavvyCal account.',
  audience: 'both',
  aiMetadata: { description: 'Lists SavvyCal events: upcoming by default, or past, all, or a start-date window, optionally filtered by state(s), search text (title, link, attendee name or email), or specific scheduling links. Use to browse or find bookings when you do not have an event id. Each event includes the attendee answers to the booking questions. Read-only and idempotent.', idempotent: true },
  props: {
    period: Property.StaticDropdown({
      displayName: 'When',
      description: 'Which meetings to return. Ignored when Start After or Start Before is set.',
      required: false,
      defaultValue: 'upcoming',
      options: {
        options: [
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Past', value: 'past' },
          { label: 'All (past and upcoming)', value: 'all' },
        ],
      },
    }),
    start_after: Property.DateTime({
      displayName: 'Start After',
      description: 'Only return events that start at or after this date and time.',
      required: false,
    }),
    start_before: Property.DateTime({
      displayName: 'Start Before',
      description: 'Only return events that start at or before this date and time.',
      required: false,
    }),
    states: Property.StaticMultiSelectDropdown({
      displayName: 'State',
      description: 'Filter events by their current status. Leave empty to return all statuses.',
      required: false,
      options: {
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Awaiting Reschedule', value: 'awaiting_reschedule' },
          { label: 'Awaiting Checkout', value: 'awaiting_checkout' },
          { label: 'Checkout Expired', value: 'checkout_expired' },
          { label: 'Awaiting Approval', value: 'awaiting_approval' },
          { label: 'Declined', value: 'declined' },
          { label: 'Tentative', value: 'tentative' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only return events whose title, description, scheduling link, or attendee name or email contains this text.',
      required: false,
    }),
    include_events_not_attending: Property.Checkbox({
      displayName: 'Include Events You Do Not Attend',
      description: 'Also return events of your teams that you do not attend yourself.',
      required: false,
      defaultValue: false,
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
          const options = await buildTeamOptions(getToken(auth));
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
          const options = await buildLinkOptions(getToken(auth), team_id);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
    newest_first: Property.Checkbox({
      displayName: 'Newest First',
      description: 'Sort events from the latest start time to the earliest.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of events to return. Leave empty to return all matching events.',
      required: false,
    }),
  },
  async run(context) {
    const {
      period,
      start_after,
      start_before,
      states,
      search,
      include_events_not_attending,
      link_ids,
      newest_first,
      limit,
    } = context.propsValue;

    const { queryParams, keep } = buildEventQuery({
      period,
      startAfter: start_after,
      startBefore: start_before,
      states,
      linkIds: link_ids,
      search,
      includeEventsNotAttending: include_events_not_attending,
      newestFirst: newest_first,
    });

    const events = await savvyCalCollect<SavvyCalEvent>({
      token: getToken(context.auth),
      path: '/events',
      queryParams,
      keep,
      limit: limit && limit > 0 ? limit : undefined,
    });
    return events.map(flattenEvent);
  },
});
