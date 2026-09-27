import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListCustomFieldsAction = createAction({
  auth: asanaAuth,
  name: 'list_custom_fields',
  classification: 'SEARCH',
  displayName: 'List Custom Fields',
  description: 'List the custom field definitions of an Asana workspace (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the custom field definitions of a workspace with type, format and enum options. Use it to find a field gid by name, or to check that a name is free before Create Custom Field. Needs a paid Asana plan; a free workspace gets a paid-plan error. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace. Obtain it from List Workspaces.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'custom fields' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { workspace, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/custom_fields`,
      operation: 'List Custom Fields',
      query: { opt_fields: ASANA_FIELDS.customFieldList },
      limit,
      offset,
    });
  },
});
