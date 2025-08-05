import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { formatDateTime, userIdDropdown } from '../common/props';

export const createEvent = createAction({
  auth: biginAuth,
  name: 'createEvent',
  displayName: 'Create Event',
  description: 'Create a new event record in Bigin',
  props: {
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Provide the title or name of the event',
      required: true,
    }),
    startDateTime: Property.DateTime({
      displayName: 'Start Date Time',
      description: 'Provide the start date and time (ISO8601) of the event',
      required: true,
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date Time',
      description: 'Provide the end date and time (ISO8601) of the event',
      required: true,
    }),
    owner: userIdDropdown,
    allDay: Property.Checkbox({
      displayName: 'All Day',
      description: 'Provide whether the event is an all-day event',
      required: false,
      defaultValue: false,
    }),

    // Recurring Activity - simplified props for easier configuration
    isRecurring: Property.Checkbox({
      displayName: 'Is Recurring Task',
      description: 'Check if this is a recurring task',
      required: false,
    }),
    recurringFrequency: Property.StaticDropdown({
      displayName: 'Recurring Frequency',
      description: 'How often the task should repeat',
      required: false,
      options: {
        options: [
          { label: 'Daily', value: 'DAILY' },
          { label: 'Weekly', value: 'WEEKLY' },
          { label: 'Monthly', value: 'MONTHLY' },
          { label: 'Yearly', value: 'YEARLY' },
        ],
      },
    }),
    recurringInterval: Property.Number({
      displayName: 'Recurring Interval',
      description:
        'Interval for recurrence (e.g., 1 for every week, 2 for every 2 weeks)',
      required: false,
    }),
    recurringUntil: Property.DateTime({
      displayName: 'Recurring Until',
      description: 'End date for recurring task',
      required: false,
    }),
    remindAt: Property.Array({
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
    relatedTo: Property.Array({
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
    participants: Property.Array({
      displayName: 'Participants',
      description:
        'Provide the unique ID(s) of the user(s) participating in the event',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the event',
      required: false,
    }),
    tag: Property.Array({
      displayName: 'Tag',
      description:
        'Provide the list of tags that can be associated with the event. You can get the list of tags from the Get all tags API',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      Event_Title: context.propsValue.eventTitle,
      Start_DateTime: formatDateTime(context.propsValue.startDateTime),
      End_DateTime: formatDateTime(context.propsValue.endDateTime),
    };

    // Add optional fields if provided
    if (context.propsValue.owner) body['Owner'] = context.propsValue.owner;
    if (context.propsValue.allDay !== undefined)
      body['All_day'] = context.propsValue.allDay;

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

    if (
      context.propsValue.isRecurring &&
      context.propsValue.recurringFrequency
    ) {
      let rrule = `FREQ=${context.propsValue.recurringFrequency}`;

      if (context.propsValue.recurringInterval) {
        rrule += `;INTERVAL=${context.propsValue.recurringInterval}`;
      }

      if (context.propsValue.recurringUntil) {
        const untilDate = new Date(context.propsValue.recurringUntil);
        rrule += `;UNTIL=${untilDate.toISOString().split('T')[0]}`;
      }

      body['Recurring_Activity'] = { RRULE: rrule };
    }
    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Events',
      context.auth.props?.['location'] || 'com',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
