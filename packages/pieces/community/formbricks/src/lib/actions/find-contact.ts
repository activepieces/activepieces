import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const findContactAction = createAction({
  auth: formBricksAuth,
  name: 'find_contact',
  classification: 'READ',
  displayName: 'Find Contact',
  description: 'Finds a contact by email or user ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Find a Formbricks contact by exact email or user ID in a workspace picked from a dropdown. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'Fill in the email or the user ID.', required: false }),
    userId: Property.ShortText({ displayName: 'User ID', required: false }),
  },
  outputSchema: formbricksSchemas.findContact,
  async run({ auth, propsValue }) {
    return formbricksApi.findContact({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace' }),
      email: formbricksInputs.optionalString(propsValue.email),
      userId: formbricksInputs.optionalString(propsValue.userId),
    });
  },
});
