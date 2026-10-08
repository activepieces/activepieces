import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const updateTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'update_time_entry',
  classification: 'WRITE',
  displayName: 'Update Time Entry',
  description: 'Update a single time entry.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one time entry by ID; omitted fields keep their value, Tags replaces the whole list, and a new stop time wins over duration. Returns the updated entry. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    time_entry_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description: 'The ID of the time entry to update.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Leave empty to keep the current description.',
      required: false,
    }),
    clear_description: Property.Checkbox({
      displayName: 'Clear Description',
      description: 'Remove the description.',
      required: false,
      defaultValue: false,
    }),
    start: Property.DateTime({
      displayName: 'Start Time',
      description: 'New start time. Leave empty to keep the current start.',
      required: false,
    }),
    stop: Property.DateTime({
      displayName: 'Stop Time',
      description: 'New stop time. Leave empty to keep the current stop.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (in seconds)',
      description:
        'New duration; ignored when Stop Time is given. Empty keeps current.',
      required: false,
    }),
    project_id: togglCommon.optional_project_id,
    task_id: togglCommon.optional_task_id,
    tags: togglCommon.tags,
    billable: togglCommon.updateFlag({
      displayName: 'Billable',
      description: 'Whether the time entry is billable.',
    }),
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const { description, clear_description, start, stop, duration, tags } =
      context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const timeEntryId = togglApi.requireId({
      value: context.propsValue.time_entry_id,
      label: 'Time Entry ID',
    });
    const projectId = togglApi.optionalId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    const taskId = togglApi.optionalId({
      value: context.propsValue.task_id,
      label: 'Task',
    });
    const billable = togglCommon.flagValue(context.propsValue.billable);
    const startIso = start
      ? togglApi.toIsoDateTime({ value: start, label: 'Start Time' })
      : undefined;
    const stopIso = stop
      ? togglApi.toIsoDateTime({ value: stop, label: 'Stop Time' })
      : undefined;
    if (description && clear_description) {
      throw new Error('Set Description or Clear Description, not both.');
    }
    if (!isNil(duration) && duration < 0) {
      throw new Error(
        'Duration must be zero or more seconds. Use Start Time Entry to start a timer.'
      );
    }
    const newDescription = clear_description ? '' : description || undefined;
    const tagList = tags && tags.length > 0 ? tags : undefined;

    return togglApi.withNotFound({
      label: `Time entry ${timeEntryId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const entryPath = togglApi.twoWorkspacePath({
            auth,
            workspaceId,
            path: `/time-entries/${timeEntryId}`,
          });
          const current = await togglApi.request<TwoTimeEntry>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: entryPath,
          });
          const effectiveStart = startIso ?? current.start ?? undefined;
          const seconds = secondsBetween({ start: effectiveStart, stop: stopIso });
          const tagIds = await togglApi.resolveTwoTagIds({
            auth,
            workspaceId,
            names: tagList,
          });
          const body = {
            ...(isNil(newDescription) ? {} : { description: newDescription }),
            ...(startIso ? { start: startIso } : {}),
            ...(isNil(seconds)
              ? isNil(duration)
                ? {}
                : { duration: Math.round(duration) }
              : { duration: seconds }),
            ...(isNil(projectId) ? {} : { project_id: projectId }),
            ...(isNil(taskId) ? {} : { task_id: taskId }),
            ...(isNil(tagIds) ? {} : { tag_ids: tagIds }),
            ...(isNil(billable) ? {} : { billable }),
          };
          if (Object.keys(body).length === 0) {
            throw new Error('Provide at least one field to update.');
          }
          await togglApi.request<unknown>({
            auth,
            method: togglApi.HttpMethod.PATCH,
            path: entryPath,
            body,
          });
          const updated = await togglApi.request<TwoTimeEntry>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: entryPath,
          });
          return togglModels.timeEntry({ item: updated, running: false });
        }

        const body = {
          ...(isNil(newDescription) ? {} : { description: newDescription }),
          ...(startIso ? { start: startIso } : {}),
          ...(stopIso ? { stop: stopIso } : {}),
          ...(!stopIso && !isNil(duration) ? { duration: Math.round(duration) } : {}),
          ...(isNil(projectId) ? {} : { project_id: projectId }),
          ...(isNil(taskId) ? {} : { task_id: taskId }),
          ...(isNil(tagList) ? {} : { tags: tagList }),
          ...(isNil(billable) ? {} : { billable }),
        };
        if (Object.keys(body).length === 0) {
          throw new Error('Provide at least one field to update.');
        }
        return togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.PUT,
          path: `/workspaces/${workspaceId}/time_entries/${timeEntryId}`,
          body,
        });
      },
    });
  },
});

function secondsBetween({
  start,
  stop,
}: {
  start: string | undefined;
  stop: string | undefined;
}): number | undefined {
  if (!start || !stop) {
    return undefined;
  }
  const seconds = Math.round(
    (new Date(stop).getTime() - new Date(start).getTime()) / 1000
  );
  if (seconds < 0) {
    throw new Error('Stop Time must be after Start Time.');
  }
  return seconds;
}
