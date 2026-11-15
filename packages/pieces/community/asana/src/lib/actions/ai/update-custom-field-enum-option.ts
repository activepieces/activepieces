import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';

export const asanaUpdateCustomFieldEnumOptionAction = createAction({
  auth: asanaAuth,
  name: 'update_custom_field_enum_option',
  classification: 'WRITE',
  displayName: 'Update Custom Field Enum Option',
  description: 'Rename, recolor, disable or re-enable an option of an Asana select custom field (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the option fields you set (name, color, enabled) and returns the option. Setting Enabled to No retires the option: it can no longer be picked, but tasks that already have it keep the value; options can never be deleted. A select field must keep at least one enabled option. Change the order with Reorder Custom Field Enum Option. Needs a paid Asana plan. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    enum_option: Property.ShortText({
      displayName: 'Option GID',
      description: 'Gid of the option to update. Obtain it from Get Custom Field (enum_options).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Option Name',
      description: 'New label. Leave empty to keep it.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'New Asana option color name, for example red, green, blue or none. Leave empty to keep it.',
      required: false,
    }),
    enabled: asanaProps.optionalBoolean({
      displayName: 'Enabled',
      description: 'Yes to make the option selectable again, No to disable (retire) it. Leave empty to keep the current state.',
    }),
  },
  async run(context) {
    const { enum_option, name, color, enabled } = context.propsValue;
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(asanaUtils.hasValue(color) ? { color: String(color).trim() } : {}),
      ...(typeof enabled === 'boolean' ? { enabled } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Option Name, Color or Enabled' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/enum_options/${asanaUtils.pathSegment(enum_option)}`,
      operation: 'Update Custom Field Enum Option',
      query: { opt_fields: ASANA_FIELDS.enumOption },
      data,
    });
  },
});
