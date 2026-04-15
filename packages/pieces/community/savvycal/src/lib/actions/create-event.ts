import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  savvyCalPaginatedCall,
  flattenEvent,
  SavvyCalEvent,
  SavvyCalSchedulingLink,
} from '../common';
import { savvyCalAuth } from '../../';

export const createEventAction = createAction({
  auth: savvyCalAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Books a meeting on a scheduling link at a specific time slot.',
  props: {
    link_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Link',
      description: 'Select the scheduling link to book a meeting on.',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        try {
          const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({
            token: auth.secret_text,
            path: '/links',
          });
          return {
            disabled: false,
            options: links.map((l) => ({
              label: `${l.name} (${l.slug})`,
              value: l.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Failed to load scheduling links. Check your connection.',
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
  },
  async run(context) {
    const response = await savvyCalApiCall<SavvyCalEvent>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/links/${context.propsValue.link_id}/events`,
      body: {
        start_at: context.propsValue.start_at,
        end_at: context.propsValue.end_at,
        display_name: context.propsValue.attendee_name,
        email: context.propsValue.attendee_email,
      },
    });
    return flattenEvent(response.body);
  },
});
