import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  flattenEvent,
  buildTeamOptions,
  buildLinkOptions,
  SavvyCalEvent,
} from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const createEventAction = createAction({
  auth: savvyCalAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Books a meeting on a scheduling link at a specific time slot.',
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
      description: 'Select the scheduling link to book a meeting on.',
      refreshers: ['team_id'],
      required: true,
      options: async ({ auth, team_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        try {
          const options = await buildLinkOptions(getToken(auth), team_id as string | null);
          return { disabled: false, options };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load scheduling links. Check your connection.',
          };
        }
      },
    }),
    start_at: Property.DateTime({
      displayName: 'Start Time',
      description:
        'The start date and time of the meeting. Must match an available slot on the scheduling link.',
      required: true,
    }),
    end_at: Property.DateTime({
      displayName: 'End Time',
      description: 'The End date and time of the meeting',
      required: true,
    }),
    attendee_name: Property.ShortText({
      displayName: 'Attendee Name',
      description: 'Full name of the person booking the meeting.',
      required: true,
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'Email address of the person booking the meeting.',
      required: true,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description: "Attendee's local time zone in Olson format (e.g. America/New_York, Europe/London, Africa/Lagos).",
      required: true,
    }),
  },
  async run(context) {
    const response = await savvyCalApiCall<SavvyCalEvent>({
      token: getToken(context.auth),
      method: HttpMethod.POST,
      path: `/links/${context.propsValue.link_id}/events`,
      body: {
        start_at: context.propsValue.start_at,
        end_at: context.propsValue.end_at,
        display_name: context.propsValue.attendee_name,
        email: context.propsValue.attendee_email,
        time_zone: context.propsValue.time_zone,
      },
    });
    return flattenEvent(response.body);
  },
});
