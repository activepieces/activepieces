import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { partyOutputSchema } from '../../common/output-schemas';
import { CreatePartyParams } from '../../common/types';

export const aiCreateOrganisation = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_create_organisation',
  classification: 'WRITE',
  displayName: 'Create Organisation',
  description: 'Creates an organisation.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new organisation (company) in Capsule CRM and returns the created party with its id. Optionally sets one work email, phone and website, an About text, owner and tags (new tag names are created). Not idempotent: every call creates another organisation, so search first to avoid duplicates.',
    idempotent: false,
  },
  outputSchema: partyOutputSchema,
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Organisation name.', required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'Work email address.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', description: 'Work phone number.', required: false }),
    website: Property.ShortText({ displayName: 'Website', description: 'Website URL.', required: false }),
    about: Property.LongText({ displayName: 'About', description: 'Background notes about the organisation.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner User ID', description: 'Numeric user ID from List Users.', required: false }),
    tags: Property.ShortText({ displayName: 'Tags', description: 'Comma-separated tag names.', required: false }),
  },
  async run({ auth, propsValue }) {
    const params: CreatePartyParams = {
      type: 'organisation',
      name: capsuleCrmClient.requiredText({ value: propsValue.name, label: 'Name' }),
      about: capsuleCrmClient.optionalText(propsValue.about),
      ownerId: capsuleCrmClient.optionalId(propsValue.owner_id),
      tags: capsuleCrmClient.splitList(propsValue.tags),
      ...contactLists({ email: propsValue.email, phone: propsValue.phone, website: propsValue.website }),
    };
    return capsuleCrmClient.createContact({ auth, params });
  },
});

function contactLists({ email, phone, website }: { email: unknown; phone: unknown; website?: unknown }): Pick<CreatePartyParams, 'emailAddresses' | 'phoneNumbers' | 'websites'> {
  const emailText = capsuleCrmClient.optionalText(email);
  const phoneText = capsuleCrmClient.optionalText(phone);
  const websiteText = capsuleCrmClient.optionalText(website);
  return {
    emailAddresses: emailText === undefined ? undefined : [{ type: 'Work', address: emailText }],
    phoneNumbers: phoneText === undefined ? undefined : [{ type: 'Work', number: phoneText }],
    websites: websiteText === undefined ? undefined : [{ type: 'Work', service: 'URL', address: websiteText }],
  };
}
