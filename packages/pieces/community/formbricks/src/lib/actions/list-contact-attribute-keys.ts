import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const listContactAttributeKeysAction = createAction({
  auth: formBricksAuth,
  name: 'list_contact_attribute_keys',
  classification: 'SEARCH',
  displayName: 'List Contact Attribute Keys',
  description: 'Lists the contact attributes (email, user ID and custom ones) defined in Formbricks.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Formbricks contact attribute keys (key, name, type default/custom, workspaceId). Use it to see which attribute keys exist before upserting contacts. Optional workspaceId filter. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Only keys of this workspace. Leave empty for all.',
      required: false,
    }),
  },
  outputSchema: formbricksSchemas.listAttributeKeys,
  async run({ auth, propsValue }) {
    const keys = await formbricksApi.listAttributeKeys({ auth, workspaceId: formbricksInputs.optionalString(propsValue.workspaceId) });
    return { keys, count: keys.length };
  },
});
