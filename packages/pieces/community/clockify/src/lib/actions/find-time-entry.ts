import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';
import { clockifyCommon } from '../common/props';

interface TimeEntry {
  id: string;
  description?: string;
  [key: string]: any;
}

export const findTimeEntry = createAction({
  auth: clockifyAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Find a time entry in Clockify',
  props: {
    workspaceId: clockifyCommon.workspace_id(),
    userId: clockifyCommon.user_id(),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Search by description text',
      required: false,
    }),
    projectId: clockifyCommon.project_id(false),
    taskId: clockifyCommon.task_id(false),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Filter by start date',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'Filter by end date',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    let queryParams = '';

    if (propsValue.projectId) {
      queryParams += `&project-id=${propsValue.projectId}`;
    }

    if (propsValue.taskId) {
      queryParams += `&task-id=${propsValue.taskId}`;
    }

    if (propsValue.startDate) {
      queryParams += `&start=${propsValue.startDate}`;
    }

    if (propsValue.endDate) {
      queryParams += `&end=${propsValue.endDate}`;
    }

    if (queryParams.length > 0) {
      queryParams = '?' + queryParams.substring(1);
    }

    const timeEntries = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/workspaces/${propsValue.workspaceId}/user/${propsValue.userId}/time-entries${queryParams}`
    ) as TimeEntry[];

    let filteredEntries = timeEntries;

    // Filter by description if provided
    if (propsValue.description) {
      filteredEntries = filteredEntries.filter((entry: TimeEntry) =>
        entry.description && entry.description.toLowerCase().includes(propsValue.description?.toLowerCase() || '')
      );
    }

    return filteredEntries;
  },
});
