import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

export const createTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'create_time_entry',
  classification: 'WRITE',
  displayName: 'Create Time Entry',
  description: 'Create a new time entry in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a time entry with a start time and a duration in seconds (a negative duration with no stop starts a running timer). Agents: prefer Log Time (Agent). Returns the created entry. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Start Time',
      description: 'The start time of the entry in UTC.',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (in seconds)',
      description:
        'Duration of the time entry. Use a negative number (e.g., -1) to start a running timer.',
      required: true,
    }),
    stop: Property.DateTime({
      displayName: 'Stop Time',
      description:
        'The stop time of the entry in UTC. Can be omitted if still running.',
      required: false,
    }),
    task_id: togglCommon.optional_task_id,
    project_id: togglCommon.optional_project_id,
    tags: togglCommon.tags,
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is marked as billable.',
      required: false,
      defaultValue: false,
    }),
    user_id: Property.Number({
      displayName: 'Creator User ID',
      description:
        'Time entry creator ID. If omitted, will use requester user ID.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const { description, start, duration, stop, tags, billable } =
      context.propsValue;
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
    const userId = togglApi.optionalId({
      value: context.propsValue.user_id,
      label: 'Creator User ID',
    });
    const startIso = togglApi.toIsoDateTime({ value: start, label: 'Start Time' });
    const stopIso = stop
      ? togglApi.toIsoDateTime({ value: stop, label: 'Stop Time' })
      : undefined;
    if (stopIso && new Date(stopIso).getTime() < new Date(startIso).getTime()) {
      throw new Error('Stop Time must be after Start Time.');
    }

    if (togglApi.isTwo(auth)) {
      if (duration < 0 && !stopIso) {
        return togglTimeEntries.twoStart({
          auth,
          workspaceId,
          start: startIso,
          description,
          projectId,
          taskId,
          tags,
          billable,
        });
      }
      const seconds = stopIso
        ? Math.round(
            (new Date(stopIso).getTime() - new Date(startIso).getTime()) / 1000
          )
        : Math.round(duration);
      const tagIds = await togglApi.resolveTwoTagIds({
        auth,
        workspaceId,
        names: tags,
      });
      const created = await togglApi.request<TwoTimeEntry>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: togglApi.twoWorkspacePath({
          auth,
          workspaceId,
          path: isNil(taskId) ? '/time-entries' : `/tasks/${taskId}/time-entries`,
        }),
        body: {
          type: 'activity',
          start: startIso,
          duration: seconds,
          ...(description ? { description } : {}),
          ...(isNil(projectId) ? {} : { project_id: projectId }),
          ...(isNil(tagIds) ? {} : { tag_ids: tagIds }),
          ...(isNil(billable) ? {} : { billable }),
          ...(isNil(userId) ? {} : { user_id: userId }),
        },
      });
      return togglModels.timeEntry({ item: created, running: false });
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/time_entries`,
      body: {
        workspace_id: workspaceId,
        description,
        start: startIso,
        duration,
        created_with: 'Activepieces',
        billable,
        ...(stopIso ? { stop: stopIso } : {}),
        ...(projectId ? { project_id: projectId } : {}),
        ...(taskId ? { task_id: taskId } : {}),
        ...(tags ? { tags } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    });
  },
});
