import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildTeamOptions, buildLinkOptions } from '../common';
import { savvyCalAuth, getToken } from '../auth';

interface SavvyCalSlot {
  start_at: string;
  end_at: string;
  duration: number;
  rank: number;
}

export const getLinkSlotsAction = createAction({
  auth: savvyCalAuth,
  name: 'get_link_slots',
  classification: 'SEARCH',
  displayName: 'Get Available Slots',
  description: 'Returns available time slots for booking on a scheduling link. Useful for displaying availability or for picking a slot before calling Create Event.',
  audience: 'both',
  aiMetadata: { description: 'Returns the bookable time slots for a given scheduling link over a period of up to 31 days (the next 7 days by default). Use to check availability or to pick a valid start/end time before calling Create Event. Requires the link id. Read-only and idempotent, though results reflect live availability and change over time.', idempotent: true },
  props: {
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
    link_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Link',
      description: 'Select the scheduling link to query slots for.',
      refreshers: ['team_id'],
      required: true,
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
    from: Property.DateTime({
      displayName: 'From',
      description: 'Start of the period to search. Leave empty to start now.',
      required: false,
    }),
    until: Property.DateTime({
      displayName: 'Until',
      description: 'End of the period to search, at most 31 days after From. Leave empty to search 7 days.',
      required: false,
    }),
  },
  async run(context) {
    const { link_id, from, until } = context.propsValue;
    const queryParams: Record<string, string> = {};
    if (from) queryParams['from'] = from;
    if (until) queryParams['until'] = until;

    const response = await savvyCalApiCall<{ entries: SavvyCalSlot[] } | SavvyCalSlot[]>({
      token: getToken(context.auth),
      method: HttpMethod.GET,
      path: `/links/${link_id}/slots`,
      queryParams,
    });
    const slots = Array.isArray(response.body) ? response.body : response.body.entries ?? [];
    return slots.map((slot) => ({
      start_at: slot.start_at,
      end_at: slot.end_at,
      duration_minutes: slot.duration,
      rank: slot.rank,
    }));
  },
});
