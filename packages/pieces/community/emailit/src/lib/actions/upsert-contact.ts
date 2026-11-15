import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitDropdowns } from '../common/dropdowns';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';

export const upsertContactAction = createAction({
  auth: emailitAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create a contact, or update the existing contact with the same email.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts an Emailit contact by email address: creates it (optionally subscribed to audiences) or updates names, custom fields (which replace all existing custom fields when given) and the campaign unsubscribed flag. On update, audiences given are added; existing memberships are kept. Returns the contact (id = con_…) with created=true/false. Running it again with the same input leaves the same contact. Use Find Contact to read it later. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.contactUpsert,
  props: { ...fields(), audiences: emailitDropdowns.audiences(), unsubscribed: unsubscribedProp() },
  async run({ auth, propsValue }) {
    return emailitOperations.upsertContact({ auth, input: { email: propsValue.email, firstName: propsValue.first_name, lastName: propsValue.last_name, customFields: propsValue.custom_fields, audiences: propsValue.audiences, unsubscribed: propsValue.unsubscribed } });
  },
});

export const upsertContactByIdAction = createAction({
  auth: emailitAuth,
  name: 'create_or_update_contact_by_id',
  displayName: 'Create or Update Contact (by Audience ID)',
  description: 'Create or update a contact, adding it to audiences given by ID.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts an Emailit contact by email address: creates it (optionally subscribed to audiences) or updates names, custom fields (which replace all existing custom fields when given) and the campaign unsubscribed flag. On update, audiences given are added; existing memberships are kept. Returns the contact (id = con_…) with created=true/false. Running it again with the same input leaves the same contact. Use Find Contact to read it later. Needs a Full Access key. Audience IDs (aud_…) come from List Audiences.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.contactUpsert,
  props: {
    ...fields(),
    audiences: Property.Array({ displayName: 'Add to Audiences', description: 'Audience IDs (aud_…) to subscribe the contact to.', required: false }),
    unsubscribed: unsubscribedProp(),
  },
  async run({ auth, propsValue }) {
    return emailitOperations.upsertContact({ auth, input: { email: propsValue.email, firstName: propsValue.first_name, lastName: propsValue.last_name, customFields: propsValue.custom_fields, audiences: propsValue.audiences, unsubscribed: propsValue.unsubscribed } });
  },
});

function fields() {
  return {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', description: 'Leave empty to keep.', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', description: 'Leave empty to keep.', required: false }),
    custom_fields: Property.Object({ displayName: 'Custom Fields', description: 'Replaces all custom fields of an existing contact. Leave empty to keep.', required: false }),
  };
}

function unsubscribedProp() {
  return Property.StaticDropdown<'keep' | 'yes' | 'no'>({
    displayName: 'Unsubscribed from Campaigns',
    required: false,
    defaultValue: 'keep',
    options: { disabled: false, options: [{ label: 'Keep as is (new contacts: subscribed)', value: 'keep' }, { label: 'Unsubscribed', value: 'yes' }, { label: 'Subscribed', value: 'no' }] },
  });
}
