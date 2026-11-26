import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { partyOutputSchema } from '../../common/output-schemas';
import { CreatePartyParams } from '../../common/types';

export const aiCreatePerson = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_create_person',
  classification: 'WRITE',
  displayName: 'Create Person',
  description: 'Creates a person.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new person in Capsule CRM and returns the created party with its id. Optionally links the person to an existing organisation (Organisation ID from Search Contacts) and sets owner, job title, one work email, one work phone and tags (new tag names are created). Not idempotent: every call creates another person, so search first to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: partyOutputSchema,
  props: {
    first_name: Property.ShortText({ displayName: 'First Name', description: 'Given name.', required: true }),
    last_name: Property.ShortText({ displayName: 'Last Name', description: 'Family name.', required: true }),
    job_title: Property.ShortText({ displayName: 'Job Title', description: 'Role, for example Sales Director.', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'Work email address.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', description: 'Work phone number.', required: false }),
    organisation_id: Property.ShortText({ displayName: 'Organisation ID', description: 'Numeric ID of an existing organisation to link.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
    about: Property.LongText({ displayName: 'About', description: 'Background notes about the person.', required: false }),
    tags: Property.ShortText({ displayName: 'Tags', description: 'Comma-separated tag names.', required: false }),
  },
  async run({ auth, propsValue }) {
    const params: CreatePartyParams = {
      type: 'person',
      firstName: capsuleCrmClient.requiredText({ value: propsValue.first_name, label: 'First Name' }),
      lastName: capsuleCrmClient.requiredText({ value: propsValue.last_name, label: 'Last Name' }),
      jobTitle: capsuleCrmClient.optionalText(propsValue.job_title),
      about: capsuleCrmClient.optionalText(propsValue.about),
      organisationId: capsuleCrmClient.optionalId(propsValue.organisation_id),
      ownerId: capsuleCrmClient.optionalId(propsValue.owner_id),
      tags: capsuleCrmClient.splitList(propsValue.tags),
      ...capsuleCrmClient.contactLists({ email: propsValue.email, phone: propsValue.phone }),
    };
    return capsuleCrmClient.createContact({ auth, params });
  },
});

