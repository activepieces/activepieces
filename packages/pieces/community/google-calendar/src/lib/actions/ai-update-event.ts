import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { updateEventProps, runUpdateEvent } from './update-event.action';
import { eventOutputSchema } from '../output-schemas';

const {
  eventId: _omitEventId,
  calendar_id: _omitCalendarId,
  guests_can_modify: _omitGuestsCanModify,
  guests_can_invite_others: _omitGuestsCanInviteOthers,
  guests_can_see_other_guests: _omitGuestsCanSeeOtherGuests,
  ...otherUpdateProps
} = updateEventProps;

function guestPermissionProp(displayName: string) {
  return Property.StaticDropdown({
    displayName,
    description: 'Leave unset to keep the event\'s current value.',
    required: false,
    options: {
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
    },
  });
}

function toOptionalBoolean(value: string | undefined): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

const props = {
  calendar_id: updateEventProps.calendar_id,
  event_id: Property.ShortText({
    displayName: 'Event ID',
    description:
      'The ID of the event to update. Resolve it via List Events or Search Events Across Calendars.',
    required: true,
  }),
  ...otherUpdateProps,
  guests_can_modify: guestPermissionProp('Guests can modify'),
  guests_can_invite_others: guestPermissionProp('Guests can invite others'),
  guests_can_see_other_guests: guestPermissionProp(
    'Guests can see other guests'
  ),
};

export const aiUpdateEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_update_event',
  displayName: 'Update Event',
  description:
    'Update fields of an existing Google Calendar event by ID using a safe get-then-merge; fields you leave unset keep their current values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update fields of an existing event (title, times, location, description, color, attendees, guest permissions) identified by calendar and event ID. It fetches the event first and merges, so unset fields keep their current values (it never blanks out attendees/recurrence/conferencing). Use this to edit or reschedule an existing event rather than recreating it. Resolve calendarId via google_calendar_list_calendars and eventId via google_calendar_list_events / google_calendar_search_events_all_calendars. Idempotent: applying the same field values repeatedly leaves the event in the same state.',
    idempotent: true,
  },
  props,
  outputSchema: eventOutputSchema,
  run: (context) =>
    runUpdateEvent({
      ...context,
      propsValue: {
        ...context.propsValue,
        eventId: context.propsValue.event_id,
        guests_can_modify: toOptionalBoolean(
          context.propsValue.guests_can_modify
        ),
        guests_can_invite_others: toOptionalBoolean(
          context.propsValue.guests_can_invite_others
        ),
        guests_can_see_other_guests: toOptionalBoolean(
          context.propsValue.guests_can_see_other_guests
        ),
      },
    }),
});
