import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../../common/auth';
import { formbricksApi } from '../../common/api';
import { formbricksInputs } from '../../common/inputs';
import { formbricksSchemas } from '../../common/schemas';

export const findContactAiAction = createAction({
  auth: formBricksAuth,
  name: 'find_contact_ai',
  classification: 'READ',
  displayName: 'Find Contact (AI)',
  description: 'Finds a Formbricks contact by email or user ID in a workspace ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Look up one Formbricks contact by exact email (case-insensitive) or exact userId within a workspace and return its ID and attributes. found is false when nothing matches. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    userId: Property.ShortText({ displayName: 'User ID', required: false }),
  },
  outputSchema: formbricksSchemas.findContact,
  async run({ auth, propsValue }) {
    return formbricksApi.findContact({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace ID' }),
      email: formbricksInputs.optionalString(propsValue.email),
      userId: formbricksInputs.optionalString(propsValue.userId),
    });
  },
});
