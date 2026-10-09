import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglAgent } from '../common/agent';
import { togglApi } from '../common/client';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

export const startTimerAi = createAction({
  auth: togglTrackAuth,
  name: 'start_timer_ai',
  classification: 'WRITE',
  displayName: 'Start Timer (Agent)',
  description: 'Starts a running timer using a project name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a running timer now. Agents: use this instead of Start Time Entry, and Log Time (Agent) when the work is already done. Needs a description; the project is optional, by name or ID (ambiguous or unknown names fail with the candidates listed). Returns the running entry; stop it with Stop Time Entry. Each call starts a new timer (on Toggl 2.0 it also stops the previous one).',
    idempotent: false,
  },
  props: {
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the timer is for.',
      required: true,
    }),
    project: Property.ShortText({
      displayName: 'Project',
      description: 'Project name or ID. Leave empty for no project.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const auth = context.auth;
    const description = context.propsValue.description.trim();
    if (!description) {
      throw new Error('Description is required.');
    }
    const { workspaceId, projectId } = await togglAgent.resolveTarget({
      auth,
      projectReference: context.propsValue.project,
    });
    const start = new Date().toISOString();

    if (togglApi.isTwo(auth)) {
      return togglTimeEntries.twoStart({
        auth,
        workspaceId,
        start,
        description,
        projectId,
        taskId: undefined,
        tags: undefined,
        billable: undefined,
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
        ...(projectId ? { project_id: projectId } : {}),
      },
    });
  },
});
