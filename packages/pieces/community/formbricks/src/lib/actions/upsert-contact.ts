import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';

export const upsertContactAction = createAction({
  auth: formBricksAuth,
  name: 'upsert_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Creates a contact, or updates the contact with the same email.',
  audience: 'human',
  aiMetadata: {
    description: 'Create or update a Formbricks contact by email in a workspace picked from a dropdown. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceId: formbricksProps.workspace({ required: true }),
    email: Property.ShortText({ displayName: 'Email', required: true }),
    userId: Property.ShortText({ displayName: 'User ID', description: 'Your own ID for this person. Optional.', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    attributes: Property.Object({
      displayName: 'Other Attributes',
      description: 'Extra attributes as key and value. New keys are created.',
      required: false,
    }),
  },
  outputSchema: formbricksSchemas.upsertContact,
  async run({ auth, propsValue }) {
    return formbricksApi.upsertContact({
      auth,
      workspaceId: formbricksInputs.requiredString({ value: propsValue.workspaceId, label: 'Workspace' }),
      email: formbricksInputs.requiredString({ value: propsValue.email, label: 'Email' }),
      attributes: {
        ...formbricksInputs.stringRecord(propsValue.attributes),
        ...formbricksInputs.stringRecord({ userId: propsValue.userId, firstName: propsValue.firstName, lastName: propsValue.lastName }),
      },
    });
  },
});
