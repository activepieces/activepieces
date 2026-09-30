import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListAssignedTasksAction = createAction({
  auth: asanaAuth,
  name: 'list_assigned_tasks',
  classification: 'SEARCH',
  displayName: 'List Assigned Tasks',
  description: 'List the tasks assigned to a user in a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists tasks assigned to one user (use "me" for the connected user\'s My Tasks) in a workspace, optionally only incomplete ones or ones changed since a moment. Use List Project Tasks for a project\'s tasks instead. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: '"me", an email address or a user gid.',
      required: true,
      defaultValue: 'me',
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace, for example 1201234567890123. Obtain it from List Workspaces or Get Current User.',
      required: true,
    }),
    completed_since: Property.ShortText({
      displayName: 'Completed Since',
      description: 'Return incomplete tasks plus tasks completed after this ISO 8601 date-time. Use "now" to return only incomplete tasks. Leave empty to return all tasks.',
      required: false,
    }),
    modified_since: Property.ShortText({
      displayName: 'Modified Since',
      description: 'Only return tasks changed after this ISO 8601 date-time, for example 2026-09-01T00:00:00Z.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { assignee, workspace, completed_since, modified_since, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/tasks',
      operation: 'List Assigned Tasks',
      query: {
        assignee: assignee.trim(),
        workspace: workspace.trim(),
        completed_since: asanaUtils.hasValue(completed_since) ? String(completed_since).trim() : undefined,
        modified_since: asanaUtils.hasValue(modified_since) ? String(modified_since).trim() : undefined,
        opt_fields: ASANA_FIELDS.taskList,
      },
      limit,
      offset,
    });
  },
});
