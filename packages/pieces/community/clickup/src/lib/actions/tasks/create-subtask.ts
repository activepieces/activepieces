import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { MarkdownVariant } from '@activepieces/shared';

import {
  clickupCommon,
  callClickUpApi,
  listAccessibleCustomFields,
} from '../../common';
import { clickupAuth } from '../../../';

export const createClickupSubtask = createAction({
  auth: clickupAuth,
  name: 'create_subtask',
  description: 'Creates a subtask in ClickUp',
  displayName: 'Create Subtask',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    name: Property.ShortText({
      description: 'The name of the subtask to create',
      displayName: 'Subtask Name',
      required: true,
    }),
    status_id: clickupCommon.status_id(),
    priority_id: clickupCommon.priority_id(),
    assignee_id: clickupCommon.assignee_id(
      false,
      'Assignee Id',
      'ID of assignee for Clickup Subtask'
    ),
    description: Property.LongText({
      description: 'The description of the subtask to create',
      displayName: 'Subtask Description',
      required: false,
    }),
    is_markdown: Property.Checkbox({
      description: 'Is the description in markdown format',
      displayName: 'Is Markdown',
      required: false,
      defaultValue: false,
    }),
    due_date: Property.DateTime({
      description: 'The due date of the subtask',
      displayName: 'Due Date',
      required: false,
    }),
    due_date_time: Property.Checkbox({
      description: 'Whether to include time in the due date',
      displayName: 'Due Date Time',
      required: false,
      defaultValue: false,
    }),
    start_date: Property.DateTime({
      description: 'The start date of the subtask',
      displayName: 'Start Date',
      required: false,
    }),
    start_date_time: Property.Checkbox({
      description: 'Whether to include time in the start date',
      displayName: 'Start Date Time',
      required: false,
      defaultValue: false,
    }),
    time_estimate: Property.Number({
      description: 'The time estimate for the subtask in milliseconds',
      displayName: 'Time Estimate',
      required: false,
    }),
    check_required_custom_fields: Property.Checkbox({
      description: 'Re-enable required custom fields validation for the subtask',
      displayName: 'Check Required Custom Fields',
      required: false,
      defaultValue: false,
    }),
    custom_fields_info: Property.MarkDown({
      value: `Select custom fields\n\nFor custom dropdown fields, choose a dropdown value based on the index (in the list, the first option is index 0, second is 1, third is 2, etc.)`,
      variant: MarkdownVariant.INFO,
    }),
    custom_fields: Property.DynamicProperties({
      displayName: 'Custom Fields',
      required: true,
      refreshers: ['list_id', 'auth'],
      props: async ({ list_id, auth }) => {
        if (!list_id || !auth) {
          return {};
        }

        // Ensure `auth` is of the correct type
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);

        // Fetch custom fields using clickupCommon
        const { fields: customFields } = await listAccessibleCustomFields(
          accessToken,
          list_id.toString()
        );

        // Map custom fields to InputPropertyMap
        const dynamicProps: Record<string, any> = {};
        customFields.forEach((field) => {
          dynamicProps[field.id] = Property.ShortText({
            displayName: field.name,
            description: `Value for the custom field: ${field.name}`,
            required: false,
          });
        });

        return dynamicProps;
      },
    }),
  },

  async run(configValue) {
    const {
      list_id,
      task_id,
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

    type SubtaskData = {
      name: string;
      parent: string | undefined;
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

    const data: SubtaskData = {
      name,
      parent: task_id, // Parent task ID for the subtask
      status: status_id,
      priority: priority_id,
      assignees: assignee_id,
    };

    // Add description or markdown content
    if (is_markdown && description) {
      data.markdown_content = description;
    } else if (description) {
      data.description = description;
    }

    // Convert due_date to integer format and add it
    if (due_date) {
      data.due_date = new Date(due_date).getTime();
      data.due_date_time = due_date_time || false;
    }

    // Convert start_date to integer format and add it
    if (start_date) {
      data.start_date = new Date(start_date).getTime();
      data.start_date_time = start_date_time || false;
    }

    // Add time estimate
    if (time_estimate) {
      data.time_estimate = time_estimate;
    }

    // Add check_required_custom_fields
    if (check_required_custom_fields) {
      data.check_required_custom_fields = check_required_custom_fields;
    }

    // Map custom_fields into the required format
    if (custom_fields) {
      data.custom_fields = Object.entries(custom_fields).map(
        ([fieldId, value]) => ({
          id: fieldId,
          value,
        })
      );
    }

    // Make the API request
    const response = await callClickUpApi(
      HttpMethod.POST,
      `list/${list_id}/task`,
      getAccessTokenOrThrow(configValue.auth),
      data
    );

    return response.body;
  },
});
