import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { partyOutputSchema } from '../../common/output-schemas';
import { UpdatePartyParams } from '../../common/types';

export const aiUpdateParty = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_update_party',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates a person or organisation.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates an existing Capsule CRM person or organisation by Party ID and returns the updated party. Only the fields you give are changed; empty fields are left as they are. First/Last Name and Job Title apply to people, Name to organisations. Add Email and Add Phone append a new entry each call and tags are added, never removed, so repeating a call with Add Email or Add Phone creates duplicate entries.',
    idempotent: false,
  },
  outputSchema: partyOutputSchema,
  props: {
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of the person or organisation.', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', description: 'New given name (people only).', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', description: 'New family name (people only).', required: false }),
    name: Property.ShortText({ displayName: 'Organisation Name', description: 'New name (organisations only).', required: false }),
    job_title: Property.ShortText({ displayName: 'Job Title', description: 'New job title (people only).', required: false }),
    about: Property.LongText({ displayName: 'About', description: 'New background text; replaces the existing text.', required: false }),
    organisation_id: Property.ShortText({ displayName: 'Organisation ID', description: 'Numeric ID of the organisation to link a person to.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
    add_email: Property.ShortText({ displayName: 'Add Email', description: 'Email address to add as a new Work entry.', required: false }),
    add_phone: Property.ShortText({ displayName: 'Add Phone', description: 'Phone number to add as a new Work entry.', required: false }),
    add_tags: Property.ShortText({ displayName: 'Add Tags', description: 'Comma-separated tag names to add.', required: false }),
  },
  async run({ auth, propsValue }) {
    const email = capsuleCrmClient.optionalText(propsValue.add_email);
    const phone = capsuleCrmClient.optionalText(propsValue.add_phone);
    const params: UpdatePartyParams = {
        firstName: capsuleCrmClient.optionalText(propsValue.first_name),
        lastName: capsuleCrmClient.optionalText(propsValue.last_name),
        name: capsuleCrmClient.optionalText(propsValue.name),
        jobTitle: capsuleCrmClient.optionalText(propsValue.job_title),
        about: capsuleCrmClient.optionalText(propsValue.about),
        organisationId: capsuleCrmClient.optionalId(propsValue.organisation_id),
        ownerId: capsuleCrmClient.optionalId(propsValue.owner_id),
        tags: capsuleCrmClient.splitList(propsValue.add_tags),
        emailAddresses: email === undefined ? undefined : [{ type: 'Work', address: email }],
        phoneNumbers: phone === undefined ? undefined : [{ type: 'Work', number: phone }],
    };
    const changes = Object.values(params).filter((item) => item !== undefined && !(Array.isArray(item) && item.length === 0));
    if (changes.length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return capsuleCrmClient.updateContact({ auth, partyId: capsuleCrmClient.segment(propsValue.party_id), params });
  },
});
