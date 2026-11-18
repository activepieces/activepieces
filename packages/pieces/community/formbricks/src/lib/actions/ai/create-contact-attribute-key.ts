import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const createContactAttributeKeyAiAction = createAction({
  auth: formBricksAuth,
  name: 'create_contact_attribute_key_ai',
  classification: 'WRITE',
  displayName: 'Create Contact Attribute Key (AI)',
  description: 'Creates a custom contact attribute key in a workspace ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a custom Formbricks contact attribute key (letters, numbers, underscores) in a workspace. Usually not needed before upserting contacts, since unknown keys are created automatically there. Fails with a conflict if the key already exists, so check List Contact Attribute Keys first.',
    idempotent: false,
  },
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
    key: Property.ShortText({ displayName: 'Key', required: true }),
    name: Property.ShortText({ displayName: 'Display Name', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
  },
  outputSchema: formbricksSchemas.attributeKey,
  async run({ auth, propsValue }) {
    return formbricksApi.createAttributeKey({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace ID' }),
      key: formbricksInputs.requiredString({ value: propsValue.key, label: 'Key' }),
      name: formbricksInputs.optionalString(propsValue.name),
      description: formbricksInputs.optionalString(propsValue.description),
    });
  },
});
