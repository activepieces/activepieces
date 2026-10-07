import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTagListOutputSchema } from '../../output-schemas';

export const asanaListTaskTagsAction = createAction({
  auth: asanaAuth,
  name: 'list_task_tags',
  classification: 'SEARCH',
  displayName: 'List Task Tags',
  description: 'List the tags on an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags currently applied to one task. Use it before Remove Tag from Task. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTagListOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'tags' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { task, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/tasks/${asanaUtils.pathSegment(task)}/tags`,
      operation: 'List Task Tags',
      query: { opt_fields: ASANA_FIELDS.tagList },
      limit,
      offset,
    });
  },
});
