import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { MarkdownVariant } from '@activepieces/pieces-framework';

import {
  clickupCommon,
  callClickUpApi,
  listAccessibleCustomFields,
} from '../../common';
import { clickupAuth } from '../../auth';
import { taskOutputSchema } from '../../output-schemas';

export const createClickupTask = createAction({
  auth: clickupAuth,
  name: 'create_task',
  classification: 'WRITE',
  description: 'Create a task in a ClickUp list.',
  audience: 'human',
  aiMetadata: { description: 'Create a new top-level task in a ClickUp list, with optional status, priority, assignees, description, dates, time estimate, and custom fields. Pick this for a standalone task; use Create Subtask to nest under a parent or Create Task From Template to inherit a template. Each call creates a new task, so it is not idempotent.', idempotent: false },
  displayName: 'Create Task',
  propertyGroups: [
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'inbox',
      props: ['workspace_id', 'space_id', 'list_id'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Task Details',
      icon: 'text',
      props: [
        'name',
        'description',
        'is_markdown',
        'assignee_id',
        'status_id',
        'priority_id',
      ],
    },
    {
      key: 'dates',
      display: 'section',
      label: 'Dates',
      icon: 'calendar',
      props: [
        'start_date',
        'due_date',
        'start_date_time',
        'due_date_time',
        'time_estimate',
      ],
    },
    {
      key: 'custom',
      display: 'section',
      label: 'List Fields',
      icon: 'sliders',
      props: [
        'custom_fields_info',
        'custom_fields',
        'check_required_custom_fields',
      ],
    },
  ],
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    name: Property.ShortText({
      description: 'The title people see on the task.',
      displayName: 'Task Name',
      placeholder: 'e.g. Prepare the launch checklist',
      required: true,
    }),
    status_id: clickupCommon.status_id(),
    priority_id: clickupCommon.priority_id(),
    assignee_id: clickupCommon.assignee_id(
      false,
      'Assignees',
      'People to assign the task to.'
    ),
    description: Property.LongText({
      description: 'Details shown on the task.',
      displayName: 'Description',
      required: false,
    }),
    is_markdown: Property.Checkbox({
      description: 'Send the description as Markdown so ClickUp formats it.',
      displayName: 'Use Markdown',
      required: false,
      defaultValue: false,
    }),
    due_date: Property.DateTime({
      description: 'When the task is due.',
      displayName: 'Due Date',
      required: false,
      width: 'half',
    }),
    due_date_time: Property.Checkbox({
      description: 'Keep the time of day, not just the date.',
      displayName: 'Include Due Time',
      required: false,
      defaultValue: false,
    }),
    start_date: Property.DateTime({
      description: 'When work on the task starts.',
      displayName: 'Start Date',
      required: false,
      width: 'half',
    }),
    start_date_time: Property.Checkbox({
      description: 'Keep the time of day, not just the date.',
      displayName: 'Include Start Time',
      required: false,
      defaultValue: false,
    }),
    time_estimate: Property.Number({
      description: 'In milliseconds, e.g. 3600000 for one hour.',
      displayName: 'Time Estimate',
      required: false,
    }),
    check_required_custom_fields: Property.Checkbox({
      description: 'Reject the task if a required custom field is empty.',
      displayName: 'Check Required Custom Fields',
      required: false,
      defaultValue: false,
    }),
    custom_fields_info: Property.MarkDown({
      value: "For dropdown custom fields, enter the option's position, starting at 0.",
      variant: MarkdownVariant.INFO,
    }),
    custom_fields: Property.DynamicProperties({
      auth: clickupAuth,
      displayName: 'Custom Fields',
      required: true,
      refreshers: ['list_id', 'auth'],
      props: async ({ list_id, auth }) => {
        if (!list_id || !auth) {
          return {};
        }

        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);

        const { fields: customFields } = await listAccessibleCustomFields(
          accessToken,
          list_id.toString()
        );

        const dynamicProps: Record<string, any> = {};
        customFields.forEach((field) => {
          dynamicProps[field.id] = Property.ShortText({
            displayName: field.name,
            description: `Value for ${field.name}.`,
            required: false,
          });
        });

        return dynamicProps;
      },
    }),
  },

  outputSchema: taskOutputSchema,
  async run(configValue) {
    const {
      list_id,
      name,
      description,
      status_id,
      priority_id,
      assignee_id,
      is_markdown,
      due_date,
      due_date_time,
      start_date,
      start_date_time,
      time_estimate,
      check_required_custom_fields,
      custom_fields,
    } = configValue.propsValue;

    type TaskData = {
      name: string;
      status?: string | undefined | string[];
      priority?: number | undefined;
      assignees?: number[] | undefined;
      markdown_content?: string;
      description?: string;
      due_date?: number;
      due_date_time?: boolean;
      start_date?: number;
      start_date_time?: boolean;
      time_estimate?: number;
      check_required_custom_fields?: boolean;
      custom_fields?: { id: string; value: any }[];
    };

    const data: TaskData = {
      name,
      status: status_id,
      priority: priority_id,
      assignees: assignee_id,
    };

    if (is_markdown && description) {
      data.markdown_content = description;
    } else if (description) {
      data.description = description;
    }

    if (due_date) {
      data.due_date = new Date(due_date).getTime();
      data.due_date_time = due_date_time || false;
    }

    if (start_date) {
      data.start_date = new Date(start_date).getTime();
      data.start_date_time = start_date_time || false;
    }

    if (time_estimate) {
      data.time_estimate = time_estimate;
    }

    if (check_required_custom_fields) {
      data.check_required_custom_fields = check_required_custom_fields;
    }

    if (custom_fields) {
      data.custom_fields = Object.entries(custom_fields).map(
        ([fieldId, value]) => ({
          id: fieldId,
          value,
        })
      );
    }

    const response = await callClickUpApi(
      HttpMethod.POST,
      `list/${list_id}/task`,
      getAccessTokenOrThrow(configValue.auth),
      data
    );

    return response.body;
  },
});
