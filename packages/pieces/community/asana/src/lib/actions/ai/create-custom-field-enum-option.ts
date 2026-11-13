import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaCreateCustomFieldEnumOptionAction = createAction({
  auth: asanaAuth,
  name: 'create_custom_field_enum_option',
  classification: 'WRITE',
  displayName: 'Create Custom Field Enum Option',
  description: 'Add a new option to an Asana single-select or multi-select custom field (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a selectable option to a single-select or multi-select custom field and returns it (gid, name, color, enabled). New options go at the end unless Insert Before or Insert After names an existing option. A field holds at most 500 options, including disabled ones; options can never be deleted, only disabled with Update Custom Field Enum Option. Check Get Custom Field first to avoid a duplicate option. Needs a paid Asana plan. Not idempotent: each call adds another option.',
    idempotent: false,
  },
  props: {
    custom_field: Property.ShortText({
      displayName: 'Custom Field GID',
      description: 'Gid of the single-select or multi-select custom field. Obtain it from List Custom Fields.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Option Name',
      description: 'Label of the new option, for example "Blocked".',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Asana option color name, for example red, orange, yellow, green, blue, purple or none. Leave empty for none.',
      required: false,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Option GID',
      description: 'Gid of an existing option of this field to place the new option before. Obtain it from Get Custom Field. Do not combine with Insert After.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Option GID',
      description: 'Gid of an existing option of this field to place the new option after. Do not combine with Insert Before.',
      required: false,
    }),
  },
  async run(context) {
    const { custom_field, name, color, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({ first: insert_before, second: insert_after, firstLabel: 'Insert Before Option GID', secondLabel: 'Insert After Option GID' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/custom_fields/${asanaUtils.pathSegment(custom_field)}/enum_options`,
      operation: 'Create Custom Field Enum Option',
      query: { opt_fields: ASANA_FIELDS.enumOption },
      data: {
        name,
        ...(asanaUtils.hasValue(color) ? { color: String(color).trim() } : {}),
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
  },
});
