import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaGetCustomFieldAction = createAction({
  auth: asanaAuth,
  name: 'get_custom_field',
  classification: 'READ',
  displayName: 'Get Custom Field',
  description: 'Get the definition of an Asana custom field (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one custom field definition: name, type, description, number format and precision, notification setting and, for select fields, every enum option with its gid, color and enabled flag. Use it to find enum option gids before Update Custom Field Enum Option or Reorder Custom Field Enum Option. Needs a paid Asana plan; a free workspace gets a paid-plan error. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    custom_field: Property.ShortText({
      displayName: 'Custom Field GID',
      description: 'Gid of the custom field. Obtain it from List Custom Fields.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/custom_fields/${asanaUtils.pathSegment(context.propsValue.custom_field)}`,
      operation: 'Get Custom Field',
      query: { opt_fields: ASANA_FIELDS.customField },
    });
  },
});
