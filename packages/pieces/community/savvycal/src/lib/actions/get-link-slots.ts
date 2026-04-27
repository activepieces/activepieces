import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildTeamOptions, buildLinkOptions } from '../common';
import { savvyCalAuth } from '../../';

interface SavvyCalSlot {
  start_at: string;
  end_at: string;
  duration: number;
  rank: number;
}

export const getLinkSlotsAction = createAction({
  auth: savvyCalAuth,
  name: 'get_link_slots',
  displayName: 'Get Available Slots',
  description: 'Returns available time slots for booking on a scheduling link. Useful for displaying availability or for picking a slot before calling Create Event.',
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
          const options = await buildTeamOptions(auth.secret_text);
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
          const options = await buildLinkOptions(auth.secret_text, team_id as string | null);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  async run(context) {
    const response = await savvyCalApiCall<{ entries: SavvyCalSlot[] } | SavvyCalSlot[]>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/links/${context.propsValue.link_id}/slots`,
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
