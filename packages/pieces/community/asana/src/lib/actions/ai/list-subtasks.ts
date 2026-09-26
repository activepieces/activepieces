import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListSubtasksAction = createAction({
  auth: asanaAuth,
  name: 'list_subtasks',
  classification: 'SEARCH',
  displayName: 'List Subtasks',
  description: 'List the subtasks of an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the direct subtasks of one task (one level deep; call again on a subtask for deeper levels). Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Parent Task GID',
      description: 'Gid of the parent task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'subtasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { task, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tasks/${asanaUtils.pathSegment(task)}/subtasks`,
      operation: 'List Subtasks',
      query: { opt_fields: ASANA_FIELDS.taskList },
      limit,
      offset,
    });
  },
});
