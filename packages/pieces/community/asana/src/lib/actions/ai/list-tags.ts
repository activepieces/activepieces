import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps } from '../../common/client';
import { asanaTagListOutputSchema } from '../../output-schemas';

export const asanaListTagsAction = createAction({
  auth: asanaAuth,
  name: 'list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List the tags in an Asana workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags of a workspace with their gid, name and color. Use it to find a tag gid for Add Tag to Task or List Tag Tasks; Search Workspace Objects finds one tag by name faster. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTagListOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace, for example 1201234567890123. Obtain it from List Workspaces.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'tags' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/tags',
      operation: 'List Tags',
      query: { workspace: workspace.trim(), opt_fields: ASANA_FIELDS.tagList },
      limit,
      offset,
    });
  },
});
