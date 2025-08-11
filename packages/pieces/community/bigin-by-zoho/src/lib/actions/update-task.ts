import { biginAuth } from '../../index';
import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { tagsDropdown, usersDropdown } from '../common/props';
import { API_ENDPOINTS } from '../common/constants';
import { getSafeLabel, handleDropdownError } from '../common/helpers';
import { biginApiService } from '../common/request';

export const updateTask = createAction({
  auth: biginAuth,
  name: 'updateTask',
  displayName: 'Update Task',
  description: 'updates a Task',
  props: {
    taskId: Property.Dropdown({
      displayName: 'Select Task',
      description: 'Choose a task to update',
      required: true,
      refreshers: ['auth'],
      options: async (context: any) => {
        if (!context.auth)
          return handleDropdownError('Please connect your account first');

        const response = await biginApiService.fetchTasks(
          context.auth.access_token,
          (context.auth as any).api_domain
        );

        return {
          options: response.data.map((task: any) => ({
            label: task.Subject,
            value: JSON.stringify(task),
          })),
        };
      },
    }),
    owner: usersDropdown,
    taskDetails: Property.DynamicProperties({
      displayName: 'Task Details',
      description: 'These fields will be prepopulated with task data',
      refreshers: ['taskId', 'auth'],
      required: true,
      props: async ({ taskId, auth }: any): Promise<InputPropertyMap> => {
        if (!taskId) return {};
        const task = JSON.parse(taskId);
        const { access_token, api_domain } = auth as any;

        const fieldsResp = await biginApiService.fetchModuleFields(
          access_token,
          api_domain,
          'Tasks'
        );

        const props: InputPropertyMap = {};
        for (const f of (fieldsResp.fields || []) as any[]) {
          const apiName = f.api_name as string;
          if (f.read_only || f.field_read_only) continue;
          if (!f.view_type || f.view_type.edit !== true) continue;
          if (apiName === 'Tag' || apiName === 'id') continue;

          const defaultValue = task[apiName] ?? undefined;
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
        return props;
      },
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
                ],
              },
            }),
            interval: Property.Number({
              displayName: 'Interval',
              required: true,
              description:
                'Indicates the time gap between each event. The INTERVAL value range from 1 to 99. For example, an INTERVAL of 2 for a WEEKLY recurring event means that there will be a two-week gap between each event.',
            }),
            count: Property.Number({
              displayName: 'Count',
              required: true,
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
            }),
            reminderWeeksBefore: Property.Number({
              displayName: 'Weeks Before',
              description: 'Number of weeks before the task to send reminder',
              required: false,
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
    relatedModule: Property.Dropdown({
      displayName: 'Related Module',
      description:
        'Select the type of entity the task is related to. Options: Contacts, Pipelines, Companies.',
      required: false,
      refreshers: ['auth'],
      defaultValue: 'Contacts',
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
      description: 'Select the specific record the task is related to.',
      required: false,
      refreshers: ['auth', 'relatedModule'],
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
    tag: tagsDropdown('Tasks'),
  },
  async run({ auth, propsValue }) {
    const { access_token, api_domain } = auth as any;

    const taskId = JSON.parse(propsValue.taskId).id;
    const taskDetails = propsValue.taskDetails as any;

    const taskData: any = {
      Subject: taskDetails.subject,
      id: taskId,
    };

    if (taskDetails.owner) {
      taskData.Owner = { id: taskDetails.owner };
    }

    if (taskDetails.dueDate) {
      const dueDate = new Date(taskDetails.dueDate);
      taskData.Due_Date = dueDate.toISOString().split('T')[0];
    }

    if (propsValue.enableRecurring && propsValue.recurringInfo) {
      if (!taskDetails.dueDate) {
        throw new Error('Due Date is required when creating recurring tasks');
      }

      const recurringInfo = propsValue.recurringInfo as any;
      const rruleParts = [`FREQ=${recurringInfo.freq}`];

      const startDate = new Date(taskDetails.dueDate);
      rruleParts.push(`DTSTART=${startDate.toISOString().split('T')[0]}`);

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

      if (recurringInfo.until) {
        rruleParts.push(`UNTIL=${recurringInfo.until}`);
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
        alarmValue += `;TRIGGER=-P${daysBefore}D;TRIGGER_TIME=${reminderTime}`;
      } else if (
        propsValue.recurringInfo &&
        reminderInfo.reminderType === 'weeks_before'
      ) {
        const weeksBefore = reminderInfo.reminderWeeksBefore || 1;
        alarmValue += `;TRIGGER=-P${weeksBefore}W;TRIGGER_TIME=${reminderTime}`;
      } else if (reminderInfo.reminderDateTime) {
        const reminderDate = new Date(reminderInfo.reminderDateTime);
        alarmValue += `;TRIGGER=DATE-TIME:${reminderDate.toISOString()}`;
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

    if (taskDetails.description) {
      taskData.Description = taskDetails.description;
    }

    if (taskDetails.priority) {
      taskData.Priority = taskDetails.priority;
    }

    if (taskDetails.status) {
      taskData.Status = taskDetails.status;
    }

    if (
      taskDetails.tag &&
      Array.isArray(taskDetails.tag) &&
      taskDetails.tag.length > 0
    ) {
      taskData.Tag = taskDetails.tag.map((tagName: any) => ({ name: tagName }));
    }

    const payload = { data: [taskData] };

    try {
      const response = await biginApiService.updateTask(
        access_token,
        api_domain,
        payload
      );

      return response.data[0];
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw new Error(error);
    }
  },
});