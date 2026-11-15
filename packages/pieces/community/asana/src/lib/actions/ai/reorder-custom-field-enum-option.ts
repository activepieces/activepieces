import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaReorderCustomFieldEnumOptionAction = createAction({
  auth: asanaAuth,
  name: 'reorder_custom_field_enum_option',
  classification: 'WRITE',
  displayName: 'Reorder Custom Field Enum Option',
  description: 'Move an option of an Asana select custom field before or after another option (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves an existing option of a single-select or multi-select custom field so it sits directly before or directly after another option of the same field, and returns the moved option (gid, name, color, enabled). Set exactly one of Before Option GID or After Option GID; read the option gids and current order with Get Custom Field. It only changes the order, never the option itself; use Update Custom Field Enum Option to rename, recolor or disable. Locked fields can only be reordered by the user who locked them. Needs a paid Asana plan. Moving to the same position again converges, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    custom_field: Property.ShortText({
      displayName: 'Custom Field GID',
      description: 'Gid of the custom field that owns the options. Obtain it from List Custom Fields.',
      required: true,
    }),
    enum_option: Property.ShortText({
      displayName: 'Option GID to Move',
      description: 'Gid of the option to move. Obtain it from Get Custom Field (enum_options).',
      required: true,
    }),
    before_enum_option: Property.ShortText({
      displayName: 'Before Option GID',
      description: 'Gid of the option to place the moved option directly before. Set this or After Option GID, not both.',
      required: false,
    }),
    after_enum_option: Property.ShortText({
      displayName: 'After Option GID',
      description: 'Gid of the option to place the moved option directly after. Set this or Before Option GID, not both.',
      required: false,
    }),
  },
  async run(context) {
    const { custom_field, enum_option, before_enum_option, after_enum_option } = context.propsValue;
    asanaUtils.assertNotBoth({ first: before_enum_option, second: after_enum_option, firstLabel: 'Before Option GID', secondLabel: 'After Option GID' });
    if (!asanaUtils.hasValue(before_enum_option) && !asanaUtils.hasValue(after_enum_option)) {
      throw new Error('Set Before Option GID or After Option GID to say where the option should move.');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/custom_fields/${asanaUtils.pathSegment(custom_field)}/enum_options/insert`,
      operation: 'Reorder Custom Field Enum Option',
      query: { opt_fields: ASANA_FIELDS.enumOption },
      data: {
        enum_option: enum_option.trim(),
        ...(asanaUtils.hasValue(before_enum_option) ? { before_enum_option: String(before_enum_option).trim() } : {}),
        ...(asanaUtils.hasValue(after_enum_option) ? { after_enum_option: String(after_enum_option).trim() } : {}),
      },
    });
  },
});
