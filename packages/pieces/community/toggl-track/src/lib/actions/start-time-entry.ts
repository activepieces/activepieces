import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

export const startTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'start_time_entry',
  classification: 'WRITE',
  displayName: 'Start Time Entry',
  description: 'Start a new time entry (live timer).',
  audience: 'human',
  aiMetadata: {
    description:
      'Starts a running timer now, optionally linked to a project, task, and tags. Returns the running entry; end it with Stop Time Entry. A retry starts another timer (on Toggl 2.0 it also stops the previous one).',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    project_id: togglCommon.optional_project_id,
    tags: togglCommon.tags,
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is marked as billable.',
      required: false,
      defaultValue: false,
    }),
    task_id: togglCommon.optional_task_id,
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const { description, tags, billable } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.optionalId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    const taskId = togglApi.optionalId({
      value: context.propsValue.task_id,
      label: 'Task',
    });
    const start = new Date().toISOString();

    if (togglApi.isTwo(auth)) {
      return togglTimeEntries.twoStart({
        auth,
        workspaceId,
        start,
        description,
        projectId,
        taskId,
        tags,
        billable,
      });
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/time_entries`,
      body: {
        workspace_id: workspaceId,
        description,
        start,
        duration: -1,
        created_with: 'Activepieces',
        billable,
        ...(projectId ? { project_id: projectId } : {}),
        ...(taskId ? { task_id: taskId } : {}),
        ...(tags ? { tags } : {}),
      },
    });
  },
});
