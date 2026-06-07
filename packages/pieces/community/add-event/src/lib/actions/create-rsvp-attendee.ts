import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventRsvpAttendee } from '../common/types';

export const addEventCreateRsvpAttendeeAction = createAction({
  auth: addEventAuth,
  name: 'create_rsvp_attendee',
  displayName: 'Create RSVP Attendee',
  description: 'Creates a new RSVP attendee on your AddEvent event.',
  props: {
    event_id: addEventProps.eventId({ required: true }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'The attendee\'s email address. Event updates and reminders are sent here.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: "The attendee's name (required by the default RSVP form).",
      required: true,
    }),
    attending: Property.StaticDropdown({
      displayName: 'Attending',
      description: "The attendee's response.",
      required: false,
      defaultValue: 'going',
      options: {
        options: [
          { label: 'Going', value: 'going' },
          { label: 'Maybe', value: 'maybe' },
          { label: 'Not Going', value: 'not-going' },
        ],
      },
    }),
    notify: Property.Checkbox({
      displayName: 'Send Notification Emails',
      description:
        'Send a confirmation email to the attendee and a notification to the organizer.',
      required: false,
      defaultValue: false,
    }),
    rsvp_form_data: Property.Object({
      displayName: 'Additional Form Fields',
      description:
        'Extra RSVP form values for custom forms, as key-value pairs. The name is set by the Name field above.',
      required: false,
    }),
  },
  async run(context) {
    const { event_id, email, name, attending, notify, rsvp_form_data } =
      context.propsValue;
    const attendee = await addEventApi.call<AddEventRsvpAttendee>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/events/${event_id}/rsvps`,
      body: {
        email,
        attending,
        notify: notify ? 'active' : undefined,
        rsvp_form_data: { name, ...(rsvp_form_data ?? {}) },
      },
    });
    return attendee;
  },
});
