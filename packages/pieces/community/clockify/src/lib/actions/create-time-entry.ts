import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { workspaceIdDropdown, projectIdDropdown, taskIdDropdown } from '../common/props';
import { clockifyAuth } from '../../index';

export const createTimeEntryAction = createAction({
  auth: clockifyAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Log time in Clockify',
  props: {
    workspaceId: workspaceIdDropdown,
    projectId: projectIdDropdown,
    taskId: taskIdDropdown,
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    start: Property.ShortText({
      displayName: 'Start Time (ISO)',
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End Time (ISO)',
      required: true,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Time Entry Type',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'REGULAR' },
          { label: 'Break', value: 'BREAK' },
        ],
      },
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      required: false,
      description: 'IDs of tags to attach to this entry.',
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields (Object)',
      required: false,
      description:
        'Object of custom field values (e.g. from dropdowns or text fields).',
    }),
    customAttributes: Property.Json({
      displayName: 'Custom Attributes (Object)',
      required: false,
      description: 'Object of new custom attribute request values.',
    }),
  },
  async run(context) {
    const {
      workspaceId,
      projectId,
      taskId,
      description,
      start,
      end,
      billable,
      type,
      tagIds,
      customFields,
      customAttributes,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const body: {
      start: string;
      end: string;
      description?: string;
      projectId?: string;
      taskId?: string;
      billable?: boolean;
      type?: 'REGULAR' | 'BREAK';
      tagIds?: string[];
      customFields?: Record<string, unknown>;
      customAttributes?: Record<string, unknown>;
    } = {
      start,
      end,
      ...(description && { description }),
      ...(projectId && { projectId }),
      ...(taskId && { taskId }),
      ...(typeof billable === 'boolean' && { billable }),
      ...(type && { type: type as 'REGULAR' | 'BREAK' }),
      ...(tagIds && { tagIds: tagIds as string[] }),
      ...(customFields && { customFields }),
      ...(customAttributes && { customAttributes }),
    };

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/time-entries`,
      body
    );
  },
});
