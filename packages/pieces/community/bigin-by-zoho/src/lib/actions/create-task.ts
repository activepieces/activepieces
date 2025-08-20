import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { API_ENDPOINTS } from '../common/constants';
import { formatDateOnly, formatDateTime, getSafeLabel, handleDropdownError } from '../common/helpers';
import { biginApiService } from '../common/request';

export const createTask = createAction({
  auth: biginAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Creates a new Task',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Provide the subject or title of the task',
      required: true,
    }),
    owner: usersDropdown,
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Provide the due date of the task (YYYY-MM-DD format)',
      required: false,
    }),
    enableRecurring: Property.Checkbox({
      displayName: 'Make Task Recurring',
      description: 'make this task recurring',
      required: false,
    }),
    recurringInfo: Property.DynamicProperties({
      displayName: 'Recurring Info',
      description:
        'Please note: Due Date must be set above for recurring tasks',
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
      description: 'Enable reminder for this task',
      required: false,
    }),
    reminderInfo: Property.DynamicProperties({
      displayName: 'Reminder Information',
      refreshers: ['enableReminder'],
      required: false,
      props: (propsValue, ctx): any => {
        if (propsValue['enableReminder']) {
          return {
            reminderAction: Property.StaticDropdown({
              displayName: 'Reminder Action',
              description: 'How the reminder should be shown',
              required: false,
              options: {
                options: [
                  { label: 'Email', value: 'EMAIL' },
                  { label: 'Popup', value: 'POPUP' },
                  { label: 'Email and Popup', value: 'EMAILANDPOPUP' },
                ],
              },
            }),
            reminderType: Property.StaticDropdown({
              displayName: 'Reminder Type',
              description: 'When to trigger the reminder',
              required: false,
              options: {
                options: [
                  { label: 'Specific Date & Time', value: 'datetime' },
                  { label: 'Days Before', value: 'days_before' },
                  { label: 'Weeks Before', value: 'weeks_before' },
                ],
              },
            }),
            reminderDateTime: Property.DateTime({
              displayName: 'Reminder Date & Time',
              description:
                'Specific date and time for reminder (for non-recurring tasks)',
              required: false,
            }),
            reminderDaysBefore: Property.Number({
              displayName: 'Days Before',
              description: 'Number of days before the task to send reminder',
              required: false,
              defaultValue: 1,
            }),
            reminderWeeksBefore: Property.Number({
              displayName: 'Weeks Before',
              description: 'Number of weeks before the task to send reminder',
              required: false,
              defaultValue: 1,
            }),
            reminderTime: Property.ShortText({
              displayName: 'Reminder Time',
              description:
                'Time for reminder in HH:MM format (24-hour, for recurring tasks)',
              required: false,
            }),
          };
        } else {
          return {};
        }
      },
    }),
    relatedModule: Property.StaticDropdown({
      displayName: 'Related Module',
      description:
        'Select the type of entity the task is related to. Options: Contacts, Pipelines, Companies.',
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
      description: 'Select the specific record the task is related to.',
      required: false,
      refreshers: ['auth', 'relatedModule'],
      defaultValue: {},
      options: async ({ auth, relatedModule }): Promise<any> => {
        if (!auth) return handleDropdownError('Please connect first');
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

        const fetchFn = fetchMap[relatedModule as keyof typeof fetchMap];

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
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Provide additional descriptions or notes related to the task',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Provide the priority level of the task',
      required: false,
      options: {
        options: [
          { label: 'High', value: 'High' },
          { label: 'Normal', value: 'Normal' },
          { label: 'Low', value: 'Low' },
          { label: 'Lowest', value: 'Lowest' },
          { label: 'Highest', value: 'Highest' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Provide the current status of the task.',
      required: false,
      options: {
        options: [
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Deferred', value: 'Deferred' },
          { label: 'Waiting for input', value: 'Waiting on someone else' },
          { label: 'Not Started', value: 'Not Started' },
        ],
      },
    }),
    tag: tagsDropdown('Tasks'),
  },
  async run({ auth, propsValue }) {
    const { access_token, api_domain } = auth as any;

    const taskData: any = {
      Subject: propsValue.subject,
    };

    if (propsValue.owner) {
      taskData.Owner = { id: propsValue.owner };
    }

    if (propsValue.dueDate) {
      taskData.Due_Date = formatDateOnly(propsValue.dueDate);
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

      taskData.Recurring_Activity = {
        RRULE: rruleParts.join(';') + ';',
      };
    }

    if (propsValue.enableReminder && propsValue.reminderInfo) {
      const reminderInfo = propsValue.reminderInfo as any;

      const reminderAction = reminderInfo.reminderAction || 'EMAIL';
      let alarmValue = `ACTION=${reminderAction}`;

      const reminderTime = reminderInfo.reminderTime || '09:00';

      if (
        propsValue.recurringInfo &&
        reminderInfo.reminderType === 'days_before'
      ) {
        const daysBefore = reminderInfo.reminderDaysBefore || 1;
        alarmValue += `;TRIGGER=P${daysBefore}D;TRIGGER_TIME=${reminderTime}`;
      } else if (
        propsValue.recurringInfo &&
        reminderInfo.reminderType === 'weeks_before'
      ) {
        const weeksBefore = reminderInfo.reminderWeeksBefore || 1;
        alarmValue += `;TRIGGER=P${weeksBefore}W;TRIGGER_TIME=${reminderTime}`;
      } else if (reminderInfo.reminderDateTime) {
        alarmValue += `;TRIGGER=DATE-TIME:${formatDateTime(reminderInfo.reminderDateTime)}`;
      }

      taskData.Remind_At = {
        ALARM: alarmValue,
      };
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
        ] || 'Contacts';
      taskData.Related_To = { id: propsValue.relatedTo };
      taskData.$related_module = relatedModule;
    }

    if (propsValue.description) {
      taskData.Description = propsValue.description;
    }

    if (propsValue.priority) {
      taskData.Priority = propsValue.priority;
    }

    if (propsValue.status) {
      taskData.Status = propsValue.status;
    }

    if (
      propsValue.tag &&
      Array.isArray(propsValue.tag) &&
      propsValue.tag.length > 0
    ) {
      taskData.Tag = propsValue.tag.map((tagName) => ({ name: tagName }));
    }

    const payload = { data: [taskData] };

    try {
      const response = await biginApiService.createTask(
        access_token,
        api_domain,
        payload
      );

      return response.data[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to create task: ${error.message}`
          : 'Failed to create task due to an unknown error'
      );
    }
  },
});