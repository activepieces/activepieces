import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaProjectListOutputSchema } from '../../output-schemas';

export const asanaListTaskProjectsAction = createAction({
  auth: asanaAuth,
  name: 'list_task_projects',
  classification: 'SEARCH',
  displayName: 'List Task Projects',
  description: 'List the projects an Asana task belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the projects a task is directly in (a task can be in several). Use it before Remove Task from Project or to find where a task lives. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectListOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'projects' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { task, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tasks/${asanaUtils.pathSegment(task)}/projects`,
      operation: 'List Task Projects',
      query: { opt_fields: ASANA_FIELDS.projectList },
      limit,
      offset,
    });
  },
});
