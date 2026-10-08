import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglAgent } from '../common/agent';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const logTimeAi = createAction({
  auth: togglTrackAuth,
  name: 'log_time_ai',
  classification: 'WRITE',
  displayName: 'Log Time (Agent)',
  description: 'Logs a completed time entry using a project name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Logs a completed time entry. Agents: use this instead of Create Time Entry. Needs a description, a start ("now" or an ISO datetime) and a duration in minutes; the project is optional, by name or ID (ambiguous or unknown names fail with the candidates listed). Returns the created entry. Each call creates a new entry, so a retry makes a duplicate.',
    idempotent: false,
  },
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the time was spent on.',
      required: true,
    }),
    project: Property.ShortText({
      displayName: 'Project',
      description: 'Project name or ID. Leave empty for no project.',
      required: false,
    }),
    start: Property.ShortText({
      displayName: 'Start',
      description: 'Start time: an ISO datetime, or "now".',
      required: true,
    }),
    duration_minutes: Property.Number({
      displayName: 'Duration (minutes)',
      description: 'How long the work took, in minutes.',
      required: true,
    }),
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const auth = context.auth;
    const description = context.propsValue.description.trim();
    if (!description) {
      throw new Error('Description is required.');
    }
    const start = togglAgent.parseStart({ value: context.propsValue.start });
    const minutes = togglAgent.parseDurationMinutes({
      value: context.propsValue.duration_minutes,
    });
    const seconds = minutes * 60;
    const { workspaceId, projectId } = await togglAgent.resolveTarget({
      auth,
      projectReference: context.propsValue.project,
    });

    if (togglApi.isTwo(auth)) {
      const created = await togglApi.request<TwoTimeEntry>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: togglApi.twoWorkspacePath({
          auth,
          workspaceId,
          path: '/time-entries',
        }),
        body: {
          type: 'activity',
          description,
          start,
          duration: seconds,
          ...(projectId ? { project_id: projectId } : {}),
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
        start,
        duration: seconds,
        created_with: 'Activepieces',
        ...(projectId ? { project_id: projectId } : {}),
      },
    });
  },
});
