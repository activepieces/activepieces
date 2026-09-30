import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_COLOR_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTagOutputSchema } from '../../output-schemas';

export const asanaUpdateTagAction = createAction({
  auth: asanaAuth,
  name: 'update_tag',
  classification: 'WRITE',
  displayName: 'Update Tag',
  description: 'Rename or recolor an Asana tag.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the tag fields you set (name, color, description); the change shows on every task carrying the tag. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTagOutputSchema,
  props: {
    tag: Property.ShortText({
      displayName: 'Tag GID',
      description: 'Gid of the tag. Obtain it from List Tags or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'New name. Leave empty to keep it.',
      required: false,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'New color. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: ASANA_COLOR_OPTIONS },
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'New description; replaces the current one. Leave empty to keep it.',
      required: false,
    }),
  },
  async run(context) {
    const { tag, name, color, notes } = context.propsValue;
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(asanaUtils.hasValue(color) ? { color } : {}),
      ...(asanaUtils.hasValue(notes) ? { notes } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Tag Name, Color or Description' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/tags/${asanaUtils.pathSegment(tag)}`,
      operation: 'Update Tag',
      query: { opt_fields: ASANA_FIELDS.tag },
      data,
    });
  },
});
