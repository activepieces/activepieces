import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaListCustomTypesAction = createAction({
  auth: asanaAuth,
  name: 'list_custom_types',
  classification: 'SEARCH',
  displayName: 'List Custom Types',
  description: 'List the custom task types of an Asana project or workspace (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists custom task types (for example Bug or Request) with their status options (name, color, enabled, completion state). Set exactly one of Project GID (types used in that project) or Workspace GID (every type in the workspace, including ones created by Asana products). Custom types need an Advanced or higher Asana plan. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of a project, to list the custom types it uses. Set this or Workspace GID, not both.',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of a workspace, to list all its custom types. Set this or Project GID, not both.',
      required: false,
    }),
    limit: asanaProps.limit({ noun: 'custom types' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { project, workspace, limit, offset } = context.propsValue;
    asanaUtils.assertNotBoth({ first: project, second: workspace, firstLabel: 'Project GID', secondLabel: 'Workspace GID' });
    if (!asanaUtils.hasValue(project) && !asanaUtils.hasValue(workspace)) {
      throw new Error('Set Project GID or Workspace GID.');
    }
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: '/custom_types',
      operation: 'List Custom Types',
      query: {
        project: asanaUtils.hasValue(project) ? String(project).trim() : undefined,
        workspace: asanaUtils.hasValue(workspace) ? String(workspace).trim() : undefined,
        opt_fields: ASANA_FIELDS.customType,
      },
      limit,
      offset,
    });
  },
});
