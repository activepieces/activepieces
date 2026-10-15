import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaStoryListOutputSchema } from '../../output-schemas';

export const asanaListTaskStoriesAction = createAction({
  auth: asanaAuth,
  name: 'list_task_stories',
  classification: 'SEARCH',
  displayName: 'List Task Stories',
  description: 'List the comments and activity of an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the stories of a task, oldest first: comments (resource_subtype comment_added) plus system activity such as assignments and due-date changes. Use it to read the comment thread or to find a comment gid for Update Comment or Delete Comment. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaStoryListOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'stories' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { task, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tasks/${asanaUtils.pathSegment(task)}/stories`,
      operation: 'List Task Stories',
      query: { opt_fields: ASANA_FIELDS.storyList },
      limit,
      offset,
    });
  },
});
