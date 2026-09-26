import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListProjectTasksAction = createAction({
  auth: asanaAuth,
  name: 'list_project_tasks',
  classification: 'SEARCH',
  displayName: 'List Project Tasks',
  description: 'List the tasks in an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tasks of one project in project order, optionally only incomplete ones. This is the free-plan way to browse tasks; use List Section Tasks for one board column or List Assigned Tasks for one person. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects (object type project).',
      required: true,
    }),
    completed_since: Property.ShortText({
      displayName: 'Completed Since',
      description: 'Return incomplete tasks plus tasks completed after this ISO 8601 date-time. Use "now" to return only incomplete tasks. Leave empty to return all tasks.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { project, completed_since, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/projects/${asanaUtils.pathSegment(project)}/tasks`,
      operation: 'List Project Tasks',
      query: {
        completed_since: asanaUtils.hasValue(completed_since) ? String(completed_since).trim() : undefined,
        opt_fields: ASANA_FIELDS.taskList,
      },
      limit,
      offset,
    });
  },
});
