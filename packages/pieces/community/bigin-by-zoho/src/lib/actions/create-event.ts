import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { API_ENDPOINTS } from '../common/constants';
import { biginApiService } from '../common/request';
import { formatDateOnly, formatDateTime, getSafeLabel, handleDropdownError } from '../common/helpers';

export const createEvent = createAction({
  auth: biginAuth,
  name: 'createEvent',
  displayName: 'Create Event',
  description: 'Creates a new event in Bigin',
  props: {
    eventTitle: Property.ShortText({
      displayName: 'Event Title',
      description: 'Provide the title or name of the event',
      required: true,
    }),
    owner: usersDropdown,
    startDateTime: Property.DateTime({
      displayName: 'Start Date & Time',
      description: 'Start date and time of the event',
      required: true,
    }),
    endDateTime: Property.DateTime({
      displayName: 'End Date & Time',
      description: 'End date and time of the event',
      required: true,
    }),
    allDay: Property.Checkbox({
      displayName: 'All Day Event',
      description: 'Mark this as an all-day event',
      required: false,
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
                  { label: 'Yearly', value: 'YEARLY' },
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
            until: Property.ShortText({
              displayName: 'Until (YYYY-MM-DD)',
              description: 'Date the recurrence ends. Format: YYYY-MM-DD',
              required: false,
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
    venue: Property.ShortText({
      displayName: 'Venue',
      description: 'Location or venue of the event',
      required: false,
    }),
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description: 'Select the type of entity the event is related to',
      required: false,
      defaultValue: 'Contacts',
      options: {
        options: [
          { label: 'Contacts', value: 'Contacts' },
          { label: 'Pipelines', value: 'Pipelines' },
          { label: 'Companies', value: 'Companies' },
        ],
      },
    }),
    relatedTo: Property.Dropdown({
      displayName: 'Related To',
      description: 'Select the specific record the event is related to',
      required: false,
      refreshers: ['auth', 'relatedModule'],
      defaultValue: {},
      options: async ({ auth, relatedModule }): Promise<any> => {
        if (!auth) return handleDropdownError('Please connect your account first');
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
    participants: Property.Array({
      displayName: 'Participants',
      description: 'Add participants to the event',
      required: false,
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
          description: 'User ID, email address, or contact ID based on type',
          required: true,
        }),
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Additional descriptions or notes related to the event',
      required: false,
    }),
    tag: tagsDropdown('Events'),
  },
  async run({ auth, propsValue }) {
    const { access_token, api_domain } = auth as any;
    const startDate = new Date(propsValue.startDateTime);
    const endDate = new Date(propsValue.endDateTime);

    if (endDate <= startDate) {
      throw new Error('End date/time must be after start date/time');
    }

    const eventData: any = {
      Event_Title: propsValue.eventTitle,
      Start_DateTime: formatDateTime(propsValue.startDateTime),
      End_DateTime: formatDateTime(propsValue.endDateTime),
    };

    if (propsValue.owner) {
      eventData.Owner = { id: propsValue.owner };
    }

    if (propsValue.allDay) {
      eventData.All_day = propsValue.allDay;
    }

    if (propsValue.enableRecurring && propsValue.recurringInfo) {
      const recurringInfo = propsValue.recurringInfo as any;
      const rruleParts: string[] = [];

      const allowedFreq = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
      if (!allowedFreq.includes(recurringInfo.freq)) {
        throw new Error('Invalid recurrence frequency. Allowed values: DAILY, WEEKLY, MONTHLY, YEARLY');
      }
      rruleParts.push(`FREQ=${recurringInfo.freq}`);
      
      if (recurringInfo.interval !== undefined) {
        const interval = Number(recurringInfo.interval);
        if (Number.isNaN(interval) || interval < 1 || interval > 99) {
          throw new Error('Interval must be a number between 1 and 99');
        }
        rruleParts.push(`INTERVAL=${recurringInfo.interval}`);
      }

      if (recurringInfo.count !== undefined) {
        const count = Number(recurringInfo.count);
        if (Number.isNaN(count) || count < 1 || count > 99) {
          throw new Error('Count must be a number between 1 and 99');
        }
        rruleParts.push(`COUNT=${recurringInfo.count}`);
      }

      if (recurringInfo.byday) {
        rruleParts.push(`BYDAY=${recurringInfo.byday}`);
      }

      if (recurringInfo.bymonthday !== undefined) {
        const bymonthday = Number(recurringInfo.bymonthday);
        if (Number.isNaN(bymonthday) || bymonthday < 1 || bymonthday > 31) {
          throw new Error('BYMONTHDAY must be a number between 1 and 31');
        }
        rruleParts.push(`BYMONTHDAY=${recurringInfo.bymonthday}`);
      }

      if (recurringInfo.bysetpos) {
        const allowedSetPos = ['1', '2', '3', '4', '-1'];
        if (!allowedSetPos.includes(String(recurringInfo.bysetpos))) {
          throw new Error('BYSETPOS must be one of 1, 2, 3, 4, -1');
        }
        rruleParts.push(`BYSETPOS=${recurringInfo.bysetpos}`);
      }

      if (recurringInfo.until) {
        const until = formatDateOnly(recurringInfo.until);
        rruleParts.push(`UNTIL=${until}`);
      }

      eventData.Recurring_Activity = {
        RRULE: rruleParts.join(';') + ';',
      };
    }

    if (propsValue.enableReminder && propsValue.reminderInfo) {
      const reminderList = propsValue.reminderInfo['reminderList'] as any[];
      eventData.Remind_At = reminderList.map((reminder: any) => ({
        unit: reminder.unit,
        period: reminder.period,
      }));
    }

    if (propsValue.venue) {
      eventData.Venue = propsValue.venue;
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

    if (propsValue.participants && Array.isArray(propsValue.participants)) {
      eventData.Participants = propsValue.participants.map(
        (participant: any) => ({
          type: participant.type,
          participant: participant.participant,
        })
      );
    }

    if (propsValue.description) {
      eventData.Description = propsValue.description;
    }

    if (
      propsValue.tag &&
      Array.isArray(propsValue.tag) &&
      propsValue.tag.length > 0
    ) {
      eventData.Tag = propsValue.tag.map((tagName) => ({ name: tagName }));
    }

    const payload = { data: [eventData] };

    try {
      const response = await biginApiService.createEvent(
        access_token,
        api_domain,
        payload
      );
      return response.data[0];
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create event: ${error.message}`
          : 'Failed to create event due to an unknown error'
      );
    }
  },
});