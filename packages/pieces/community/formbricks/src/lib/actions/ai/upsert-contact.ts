import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const upsertContactAiAction = createAction({
  auth: formBricksAuth,
  name: 'upsert_contact_ai',
  classification: 'WRITE',
  displayName: 'Create or Update Contact (AI)',
  description: 'Upserts a Formbricks contact by email in a workspace ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Formbricks contact or update the existing one with the same email in the workspace. attributes is an object of string values (for example {"firstName": "Ada", "userId": "u1", "plan": "pro"}); unknown keys are created as custom attributes. Returns the contact ID. Safe to retry with the same input.',
    idempotent: true,
  },
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
    attributes: Property.Json({ displayName: 'Attributes', description: 'Object of attribute key to string value.', required: false }),
  },
  outputSchema: formbricksSchemas.upsertContact,
  async run({ auth, propsValue }) {
    return formbricksApi.upsertContact({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace ID' }),
      email: formbricksInputs.requiredString({ value: propsValue.email, label: 'Email' }),
      attributes: formbricksInputs.stringRecord(propsValue.attributes),
    });
  },
});
