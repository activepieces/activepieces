import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const createContactAttributeKeyAction = createAction({
  auth: formBricksAuth,
  name: 'create_contact_attribute_key',
  classification: 'WRITE',
  displayName: 'Create Contact Attribute Key',
  description: 'Adds a custom contact attribute, such as plan or company.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a custom Formbricks contact attribute key in a workspace picked from a dropdown. Fails if the key exists.',
    idempotent: false,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: true }),
    key: Property.ShortText({ displayName: 'Key', description: 'Letters, numbers and underscores, for example company_size.', required: true }),
    name: Property.ShortText({ displayName: 'Display Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  outputSchema: formbricksSchemas.attributeKey,
  async run({ auth, propsValue }) {
    return formbricksApi.createAttributeKey({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace' }),
      key: formbricksInputs.requiredString({ value: propsValue.key, label: 'Key' }),
      name: formbricksInputs.optionalString(propsValue.name),
      description: formbricksInputs.optionalString(propsValue.description),
    });
  },
});
