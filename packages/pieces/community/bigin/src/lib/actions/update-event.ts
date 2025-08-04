import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { eventIdDropdown } from '../common/props';

export const updateEvent = createAction({
  auth: biginAuth,
  name: 'updateEvent',
  displayName: 'Update Event',
  description: 'Update an existing event record in Bigin',
  props: {
    recordId: eventIdDropdown,
    owner: Property.Json({
      displayName: 'Owner',
      description:
        'The ID of the owner to which the event record will be assigned. You can get the owner ID (or user ID) from the Get users data API.',
      required: false,
    }),
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Provide the title or name of the event',
      required: false,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date Time',
      description: 'Provide the start date and time (ISO8601) of the event',
      required: false,
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date Time',
      description: 'Provide the end date and time (ISO8601) of the event',
      required: false,
    }),
    allDay: Property.Checkbox({
      displayName: 'All Day',
      description: 'Provide whether the event is an all-day event',
      required: false,
    }),
    recurringActivity: Property.Json({
      displayName: 'Recurring Activity',
      description:
        'Contains the details about the recurrence pattern of the event in the key RRULE. Example: {"RRULE": "FREQ=MONTHLY;INTERVAL=1;BYDAY=MO;UNTIL=2023-09-05"}',
      required: false,
    }),
    remindAt: Property.Json({
      displayName: 'Remind At',
      description:
        'Provide the reminder list to notify or prompt participants before the event. Set this using time unit values such as unit and period',
      required: false,
    }),
    venue: Property.ShortText({
      displayName: 'Venue',
      description: 'Provide the location or venue of the event',
      required: false,
    }),
    relatedTo: Property.Json({
      displayName: 'Related To',
      description:
        'Provide the unique ID of the entity (Contact, Pipeline or Company) that the event is related to',
      required: false,
    }),
    relatedModule: Property.ShortText({
      displayName: 'Related Module',
      description:
        'Provide the type of entity the event is linked to. Use Contacts, Deals or Accounts to match the record in Related_To',
      required: false,
    }),
    participants: Property.Json({
      displayName: 'Participants',
      description:
        'Provide a list of participants or attendees associated with the event',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the event',
      required: false,
    }),
    tag: Property.Json({
      displayName: 'Tag',
      description:
        'Provide the list of tags that can be associated with the event. You can get the list of tags from the Get all tags API',
      required: false,
    }),
  },
  async run(context) {
    // Format datetime for Bigin API
    const formatDateTime = (dateTime: string | Date): string => {
      if (typeof dateTime === 'string') {
        return dateTime.replace('.000Z', '+00:00');
      } else {
        const date = new Date(dateTime);
        return date.toISOString().replace('.000Z', '+00:00');
      }
    };

    const body: Record<string, unknown> = {
      id: context.propsValue.recordId,
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.eventTitle)
      body['Event_Title'] = context.propsValue.eventTitle;
    if (context.propsValue.startDateTime)
      body['Start_DateTime'] = formatDateTime(context.propsValue.startDateTime);
    if (context.propsValue.endDateTime)
      body['End_DateTime'] = formatDateTime(context.propsValue.endDateTime);
    if (context.propsValue.allDay !== undefined)
      body['All_day'] = context.propsValue.allDay;
    if (context.propsValue.recurringActivity)
      body['Recurring_Activity'] = context.propsValue.recurringActivity;
    if (context.propsValue.remindAt)
      body['Remind_At'] = context.propsValue.remindAt;
    if (context.propsValue.venue) body['Venue'] = context.propsValue.venue;
    if (context.propsValue.relatedTo)
      body['Related_To'] = context.propsValue.relatedTo;
    if (context.propsValue.relatedModule)
      body['$related_module'] = context.propsValue.relatedModule;
    if (context.propsValue.participants)
      body['Participants'] = context.propsValue.participants;
    if (context.propsValue.description)
      body['Description'] = context.propsValue.description;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Events',
      {
        data: [body],
      }
    );

   return response.data[0];
  },
});
