import { createAction, Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { formbricksApi } from '../common/api';
import { formbricksInputs } from '../common/inputs';
import { formbricksSchemas } from '../common/schemas';

export const deleteContactAction = createAction({
  auth: formBricksAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently deletes a contact and its attributes.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete one Formbricks contact by contact ID (use Find Contact to get it). Cannot be undone; a retry after success fails with not found.',
    idempotent: false,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Use Find Contact to get the ID from an email.',
      required: true,
    }),
  },
  outputSchema: formbricksSchemas.deleted,
  async run({ auth, propsValue }) {
    return formbricksApi.deleteContact({ auth, contactId: formbricksInputs.requiredString({ value: propsValue.contactId, label: 'Contact ID' }) });
  },
});
