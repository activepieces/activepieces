import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_COLOR_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTagOutputSchema } from '../../output-schemas';

export const asanaCreateTagAction = createAction({
  auth: asanaAuth,
  name: 'create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Create a tag in an Asana workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new tag in a workspace, with optional color and description. Check List Tags or Search Workspace Objects first to reuse an existing tag instead of making a look-alike; apply it with Add Tag to Task. Each call creates a separate tag, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaTagOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace, for example 1201234567890123. Obtain it from List Workspaces.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Name of the tag, for example "urgent".',
      required: true,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'Tag color. Leave empty for no color.',
      required: false,
      options: { disabled: false, options: ASANA_COLOR_OPTIONS },
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'Optional description of what the tag means.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace, name, color, notes } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/tags',
      operation: 'Create Tag',
      query: { opt_fields: ASANA_FIELDS.tag },
      data: {
        workspace: workspace.trim(),
        name,
        ...(asanaUtils.hasValue(color) ? { color } : {}),
        ...(asanaUtils.hasValue(notes) ? { notes } : {}),
      },
    });
  },
});
