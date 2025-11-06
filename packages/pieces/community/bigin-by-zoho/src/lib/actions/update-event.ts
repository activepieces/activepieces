import { biginAuth } from '../../index';
import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
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
      props: async ({ eventId, auth }: any): Promise<InputPropertyMap> => {
        if (!eventId) return {};
        const event = JSON.parse(eventId);
        const { access_token, api_domain } = auth as any;

        const fieldsResp = await biginApiService.fetchModuleFields(
          access_token,
          api_domain,
          'Events'
        );

        const props: InputPropertyMap = {};
        for (const f of (fieldsResp.fields || []) as any[]) {
          const apiName = f.api_name as string;

          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.edit !== true) continue;
          if (
            apiName === 'Tag' ||
            apiName === 'id' ||
            apiName === 'Owner' ||
            apiName === 'Related_To' ||
            apiName === '$related_module' ||
            apiName === 'Recurring_Activity' ||
            apiName === 'Remind_At' ||
            apiName === 'Participants'
          )
            continue;

      const defaultValue = event[apiName] ?? undefined;
          switch ((f.data_type as string)?.toLowerCase()) {
            case 'picklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'multiselectpicklist': {
              const options = (f.pick_list_values || []).map((pl: any) => ({
                label: pl.display_value,
                value: pl.actual_value,
              }));
              props[apiName] = Property.StaticMultiSelectDropdown({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
                options: { options },
              });
              break;
            }
            case 'boolean': {
              props[apiName] = Property.Checkbox({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: Boolean(defaultValue),
              });
              break;
            }
            case 'date': {
              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || 'Format: YYYY-MM-DD',
                required: false,
                defaultValue,
              });
              break;
            }
            case 'datetime': {
              props[apiName] = Property.DateTime({
                displayName: f.display_label || f.field_label || apiName,
                description:
                  f.tooltip || 'Format: ISO 8601 (YYYY-MM-DDTHH:mm:ss±HH:mm)',
                required: false,
                defaultValue,
              });
              break;
            }
            case 'integer':
            case 'long':
            case 'double':
            case 'decimal':
            case 'currency':
            case 'percent': {
              props[apiName] = Property.Number({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue,
              });
              break;
            }
            default: {
              if (apiName === 'Description') {
                props[apiName] = Property.LongText({
                  displayName: 'Description',
                  required: false,
                  defaultValue,
                });
                break;
              }
              props[apiName] = Property.ShortText({
                displayName: f.display_label || f.field_label || apiName,
                description: f.tooltip || undefined,
                required: false,
                defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined,
              });
            }
          }
        }

        props['Participants'] = Property.Array({
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
              description: 'User ID, email address, or contact ID based on type',
              required: true,
            }),
          },
        });

        return props;
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

    const eventFields = propsValue.eventFields as Record<string, any> | undefined;

    if (propsValue.owner) {
      eventData.Owner = { id: propsValue.owner };
    }

    if (eventFields && typeof eventFields === 'object') {
      for (const [apiName, value] of Object.entries(eventFields)) {
        if (
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)
        ) {
          continue;
        }
        if (apiName === 'Participants') {
          eventData.Participants = (value as any[]).map((p: any) => ({
            type: p.type,
            participant: p.participant,
          }));
          continue;
        }
        if (apiName === 'Start_DateTime' || apiName === 'End_DateTime') {
          eventData[apiName] = formatDateTime(value);
          continue;
        }
        if (apiName === 'All_day') {
          eventData.All_day = value;
          continue;
        }
        (eventData as any)[apiName] = value;
      }
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

    if (eventFields?.['venue']) {
      eventData.Venue = eventFields['venue'];
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
