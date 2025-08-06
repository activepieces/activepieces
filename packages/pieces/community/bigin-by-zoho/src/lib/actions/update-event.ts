import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { API_ENDPOINTS } from '../common/constants';
import { biginApiService } from '../common/request';
import {
  formatDateTime,
  getSafeLabel,
  handleDropdownError,
} from '../common/helpers';

export const updateEvent = createAction({
  auth: biginAuth,
  name: 'updateEvent',
  displayName: 'Update Event',
  description: 'Updates an existing event in Bigin',
  props: {
    eventId: Property.Dropdown({
      displayName: 'Select Event',
      description: 'Choose the event to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }): Promise<any> => {
        if (!auth)
          return handleDropdownError('Please connect your account first');

        const { access_token, api_domain } = auth as any;

        try {
          const response = await biginApiService.fetchEvents(
            access_token,
            api_domain
          );
          const events = response?.data || [];

          return {
            options: events.map((event: any) => ({
              label: `${event.Event_Title} - ${event.Start_DateTime}`,
              value: JSON.stringify(event),
            })),
          };
        } catch (error) {
          return handleDropdownError('Failed to fetch events');
        }
      },
    }),
    eventFields: Property.DynamicProperties({
      displayName: 'Event Fields',
      refreshers: ['auth', 'eventId'],
      required: false,
      props: async (propsValue, ctx): Promise<any> => {
        if (!propsValue['eventId']) {
          return {
            note: Property.ShortText({
              displayName: 'Note',
              description: 'Select an event to see its current values',
              required: false,
            }),
          };
        }

        const event = JSON.parse(propsValue['eventId'] as any);

        return {
          eventTitle: Property.ShortText({
            displayName: 'Event Title',
            description: 'Title or name of the event',
            required: false,
            defaultValue: event.Event_Title || '',
          }),
          startDateTime: Property.DateTime({
            displayName: 'Start Date & Time',
            description: 'Start date and time of the event',
            required: false,
            defaultValue: event.Start_DateTime || '',
          }),
          endDateTime: Property.DateTime({
            displayName: 'End Date & Time',
            description: 'End date and time of the event',
            required: false,
            defaultValue: event.End_DateTime || '',
          }),
          allDay: Property.Checkbox({
            displayName: 'All Day Event',
            description: 'Mark this as an all-day event',
            required: false,
            defaultValue: event.All_day || false,
          }),
          venue: Property.ShortText({
            displayName: 'Venue',
            description: 'Location or venue of the event',
            required: false,
            defaultValue: event.Venue || '',
          }),
          description: Property.LongText({
            displayName: 'Description',
            description: 'Additional descriptions or notes',
            required: false,
            defaultValue: event.Description || '',
          }),
          participants: Property.Array({
            displayName: 'Participants',
            description: 'Add participants to the event',
            required: false,
            defaultValue: event.Participants || [],
            properties: {
              type: Property.StaticDropdown({
                displayName: 'Participant Type',
                required: true,
                options: {
                  options: [
                    { label: 'User', value: 'user' },
                    { label: 'Email', value: 'email' },
                    { label: 'Contact', value: 'contact' },
                  ],
                },
              }),
              participant: Property.ShortText({
                displayName: 'Participant ID/Email',
                description:
                  'User ID, email address, or contact ID based on type',
                required: true,
              }),
            },
          }),
        };
      },
    }),

    enableRecurring: Property.Checkbox({
      displayName: 'Make Event Recurring',
      description: 'Make this event recurring',
      required: false,
    }),

    recurringInfo: Property.DynamicProperties({
      displayName: 'Recurring Info',
      refreshers: ['enableRecurring'],
      required: false,
      props: (propsValue, ctx): any => {
        if (propsValue['enableRecurring']) {
          return {
            freq: Property.StaticDropdown({
              displayName: 'Frequency',
              required: true,
              options: {
                options: [
                  { label: 'Daily', value: 'DAILY' },
                  { label: 'Weekly', value: 'WEEKLY' },
                  { label: 'Monthly', value: 'MONTHLY' },
                ],
              },
            }),
            interval: Property.Number({
              displayName: 'Interval',
              required: true,
              description:
                'Indicates the time gap between each event. The INTERVAL value range from 1 to 99. For example, an INTERVAL of 2 for a WEEKLY recurring event means that there will be a two-week gap between each event.',
              defaultValue: 1,
            }),
            count: Property.Number({
              displayName: 'Count',
              required: true,
              defaultValue: 1,
              description:
                'Indicates the number of events you want to create. THE COUNT value range from 1 to 99. For example, a COUNT of 3 creates three individual events.',
            }),
            byday: Property.StaticDropdown({
              displayName: 'By Day',
              required: false,
              description:
                'Indicates the day of the week the event repeats. The possible values are SU, MO, TU, WE, TH, FR, or SA. This is applicable only for weekly, and monthly events.',
              options: {
                options: [
                  { label: 'Sunday', value: 'SU' },
                  { label: 'Monday', value: 'MO' },
                  { label: 'Tuesday', value: 'TU' },
                  { label: 'Wednesday', value: 'WE' },
                  { label: 'Thursday', value: 'TH' },
                  { label: 'Friday', value: 'FR' },
                  { label: 'Saturday', value: 'SA' },
                ],
              },
            }),
            bymonthday: Property.Number({
              displayName: 'By Month Day',
              required: false,
              description:
                ' Indicates the day of the month the event repeats. The BYMONTHDAY value range from 1 to 31. This is applicable only for weekly and monthly events.',
            }),
            bysetpos: Property.StaticDropdown({
              displayName: 'By Set Position',
              required: false,
              description:
                'Indicates the week of the month the event repeats. The possible values are 1 for the first week of the month, 2 for the second week of the month, 3 the for third week of the month, 4 for the fourth week of the month, or -1 for the last week of the month. This is applicable only for weekly and monthly events.',
              options: {
                options: [
                  { label: 'First Week of the Month', value: '1' },
                  { label: 'Second Week of the Month', value: '2' },
                  { label: 'Third Week of the Month', value: '3' },
                  { label: 'Fourth Week of the Month', value: '4' },
                  { label: 'Last Week of the Month', value: '-1' },
                ],
              },
            }),
          };
        } else {
          return {};
        }
      },
    }),

    enableReminder: Property.Checkbox({
      displayName: 'Enable Reminder',
      description: 'Enable reminder for this event',
      required: false,
    }),
    reminderInfo: Property.DynamicProperties({
      displayName: 'Reminder Information',
      refreshers: ['enableReminder'],
      required: false,
      props: (propsValue, ctx): any => {
        if (propsValue['enableReminder']) {
          return {
            reminderList: Property.Array({
              displayName: 'Reminder List',
              description:
                'Add multiple reminders (e.g., "1 hour", "30 minutes")',
              required: false,
              properties: {
                unit: Property.Number({
                  displayName: 'Time Value',
                  description: 'Number of time units (e.g., 1, 30)',
                  required: true,
                }),
                period: Property.StaticDropdown({
                  displayName: 'Time Period',
                  required: true,
                  options: {
                    options: [
                      { label: 'Days', value: 'days' },
                      { label: 'Weeks', value: 'weeks' },
                    ],
                  },
                }),
              },
            }),
          };
        } else {
          return {};
        }
      },
    }),

    owner: usersDropdown,

    relatedModule: Property.Dropdown({
      displayName: 'Related Module',
      description: 'Select the type of entity the event is related to',
      required: false,
      refreshers: ['auth'],
      options: async () => ({
        options: [
          { label: 'Contacts', value: 'Contacts' },
          { label: 'Pipelines', value: 'Pipelines' },
          { label: 'Companies', value: 'Companies' },
        ],
      }),
    }),
    relatedTo: Property.Dropdown({
      displayName: 'Related To',
      description: 'Select the specific record the event is related to',
      required: false,
      refreshers: ['auth', 'relatedModule'],
      options: async ({ auth, relatedModule }): Promise<any> => {
        if (!auth)
          return handleDropdownError('Please connect your account first');
        if (!relatedModule) return { options: [] };

        const { access_token, api_domain } = auth as any;

        const fetchMap: Record<string, () => Promise<any>> = {
          Contacts: () =>
            biginApiService.fetchContacts(access_token, api_domain),
          Pipelines: () =>
            biginApiService.fetchPipelinesRecords(access_token, api_domain),
          Companies: () =>
            biginApiService.fetchCompanies(access_token, api_domain),
        };

        const fetchFn =
          fetchMap[(relatedModule as keyof typeof fetchMap) || 'Contacts'];
        const response = await fetchFn();
        const records = response?.data || [];

        return {
          options: records.map((item: any) => ({
            label: getSafeLabel(item),
            value: item.id,
          })),
        };
      },
    }),

    tag: tagsDropdown('Events'),
  },

  async run({ auth, propsValue }) {
    const { access_token, api_domain } = auth as any;

    const eventId = JSON.parse(propsValue.eventId as string).id;

    const eventData: any = {
      id: eventId,
    };

    const eventFields = propsValue.eventFields as any;

    if (eventFields?.eventTitle) {
      eventData.Event_Title = eventFields.eventTitle;
    }

    if (eventFields?.startDateTime) {
      eventData.Start_DateTime = formatDateTime(eventFields.startDateTime);
    }

    if (eventFields?.endDateTime) {
      eventData.End_DateTime = formatDateTime(eventFields.endDateTime);
    }

    if (propsValue.owner) {
      eventData.Owner = { id: propsValue.owner };
    }

    if (eventFields?.allDay !== undefined) {
      eventData.All_day = eventFields.allDay;
    }

    if (propsValue.enableRecurring) {
      const rruleParts: string[] = [];
      const { recurringInfo } = propsValue as any;

      if (recurringInfo.freq) {
        rruleParts.push(`FREQ=${recurringInfo.freq}`);
      }

      if (recurringInfo.interval) {
        rruleParts.push(`INTERVAL=${recurringInfo.interval}`);
      }

      if (recurringInfo.count) {
        rruleParts.push(`COUNT=${recurringInfo.count}`);
      }

      if (recurringInfo.byday) {
        rruleParts.push(`BYDAY=${recurringInfo.byday}`);
      }

      if (recurringInfo.bymonthday) {
        rruleParts.push(`BYMONTHDAY=${recurringInfo.bymonthday}`);
      }

      if (recurringInfo.bysetpos) {
        rruleParts.push(`BYSETPOS=${recurringInfo.bysetpos}`);
      }

      if (rruleParts.length > 0) {
        eventData.Recurring_Activity = {
          RRULE: rruleParts.join(';') + ';',
        };
      }
    }

    if (
      propsValue.enableReminder &&
      propsValue.reminderInfo?.['reminderList']
    ) {
      const reminderList = propsValue.reminderInfo?.['reminderList'] as any[];
      eventData.Remind_At = reminderList.map((reminder: any) => ({
        unit: reminder.unit,
        period: reminder.period,
      }));
    }

    if (eventFields?.venue) {
      eventData.Venue = eventFields.venue;
    }

    if (propsValue.relatedTo && propsValue.relatedModule) {
      const relatedModuleMap = {
        Contacts: 'Contacts',
        Pipelines: 'Deals',
        Companies: 'Accounts',
      };

      const relatedModule =
        relatedModuleMap[
          propsValue.relatedModule as keyof typeof relatedModuleMap
        ];

      eventData.Related_To = { id: propsValue.relatedTo };
      eventData.$related_module = relatedModule;
    }

    if (
      propsValue.eventFields?.['participants'] &&
      Array.isArray(propsValue.eventFields?.['participants'])
    ) {
      const participants = propsValue.eventFields?.['participants'] as any[];
      eventData.Participants = participants.map(
        (participant: any) => ({
          type: participant.type,
          participant: participant.participant,
        })
      );
    }

    if (eventFields?.description) {
      eventData.Description = eventFields.description;
    }

    if (
      propsValue.tag &&
      Array.isArray(propsValue.tag) &&
      propsValue.tag.length > 0
    ) {
      eventData.Tag = propsValue.tag.map((tagName) => ({ name: tagName }));
    }

    if (Object.keys(eventData).length === 0) {
      throw new Error('No fields to update. Please modify at least one field.');
    }

    const payload = { data: [eventData] };

    try {
      const response = await biginApiService.updateEvent(
        access_token,
        api_domain,
        payload
      );
      return response.data[0];
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to update event: ${error.message}`
          : 'Failed to update event due to an unknown error'
      );
    }
  },
});
