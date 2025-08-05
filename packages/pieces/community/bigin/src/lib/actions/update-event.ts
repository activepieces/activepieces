import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { eventIdDropdown, tagDropdown, userIdDropdown } from '../common/props';

export const updateEvent = createAction({
  auth: biginAuth,
  name: 'updateEvent',
  displayName: 'Update Event',
  description: 'Update an existing event record in Bigin',
  props: {
    recordId: eventIdDropdown,
    owner: userIdDropdown,
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
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide the due date of the task (YYYY-MM-DD format)',
      required: false,
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
    tag: tagDropdown('Events'),
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

      if (context.propsValue.dueDate) {
        const startDate = new Date(context.propsValue.dueDate);
        rrule += `;DTSTART=${startDate.toISOString().split('T')[0]}`;
      }

      body['Recurring_Activity'] = { RRULE: rrule };
    }

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.PUT,
      '/Events',
      context.auth.props?.['location'] || 'com',
      {
        data: [body],
      }
    );

    return response.data[0];
  },
});
