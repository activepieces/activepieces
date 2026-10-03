import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskListOutputSchema } from '../../output-schemas';

export const asanaListTagTasksAction = createAction({
  auth: asanaAuth,
  name: 'list_tag_tasks',
  classification: 'SEARCH',
  displayName: 'List Tag Tasks',
  description: 'List the tasks that carry an Asana tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tasks carrying one tag, across all projects of the workspace. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskListOutputSchema,
  props: {
    tag: Property.ShortText({
      displayName: 'Tag GID',
      description: 'Gid of the tag. Obtain it from List Tags or Search Workspace Objects (object type tag).',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { tag, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tags/${asanaUtils.pathSegment(tag)}/tasks`,
      operation: 'List Tag Tasks',
      query: { opt_fields: ASANA_FIELDS.taskList },
      limit,
      offset,
    });
  },
});
