import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteCustomFieldOutputSchema } from '../../output-schemas';

export const asanaDeleteCustomFieldAction = createAction({
  auth: asanaAuth,
  name: 'delete_custom_field',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Custom Field',
  description: 'Delete an Asana custom field definition (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a custom field definition from the workspace; the API offers no way to restore it, and every task, project or portfolio using the field is affected. To retire a single select option instead, set its Enabled to No with Update Custom Field Enum Option. Locked fields can only be deleted by the user who locked them. Needs a paid Asana plan. Irreversible; repeating the call on the same field fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteCustomFieldOutputSchema,
  props: {
    custom_field: Property.ShortText({
      displayName: 'Custom Field GID',
      description: 'Gid of the custom field to delete. Obtain it from List Custom Fields.',
      required: true,
    }),
  },
  async run(context) {
    const customField = context.propsValue.custom_field.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/custom_fields/${asanaUtils.pathSegment(customField)}`,
      operation: 'Delete Custom Field',
    });
    return { success: true, custom_field_gid: customField };
  },
});
