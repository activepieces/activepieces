import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListTaskDependenciesAction = createAction({
  auth: asanaAuth,
  name: 'list_task_dependencies',
  classification: 'SEARCH',
  displayName: 'List Task Dependencies',
  description: 'List the tasks that an Asana task depends on (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tasks a task is waiting on (its dependencies), with name, completion, due dates and assignee. Use it before Add Task Dependencies (30 dependencies and dependents combined at most) or to find the gids for Remove Task Dependencies. Needs a paid Asana plan; a free workspace gets a paid-plan error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task whose dependencies to list. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { task, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tasks/${asanaUtils.pathSegment(task)}/dependencies`,
      operation: 'List Task Dependencies',
      query: { opt_fields: ASANA_FIELDS.taskList },
      limit,
      offset,
    });
  },
});
