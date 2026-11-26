import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiCreateContactAction = createAction({
  auth: apolloAuth,
  name: 'ai_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Save a person as a contact in Apollo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves a person as a contact in your Apollo CRM. if_match_exists is required: update_existing makes Apollo look for a contact with the same email (or name and company) and overwrite it with the values given; always_create always adds a new contact, which duplicates on retry. Uses no credits.',
    idempotent: false,
  },
  props: {
    if_match_exists: aiProps.choice({
      displayName: 'If a Matching Contact Exists',
      description: 'update_existing: update the match instead of duplicating. always_create: always add a new contact.',
      required: true,
      options: [
        { label: 'Update the existing contact', value: 'update_existing' },
        { label: 'Always create a new contact', value: 'always_create' },
      ],
    }),
    first_name: aiProps.text({ displayName: 'First Name', description: 'First name.', required: false }),
    last_name: aiProps.text({ displayName: 'Last Name', description: 'Last name.', required: false }),
    email: aiProps.text({ displayName: 'Email', description: 'Email address.', required: false }),
    title: aiProps.text({ displayName: 'Job Title', description: 'Job title.', required: false }),
    organization_name: aiProps.text({ displayName: 'Company Name', description: 'Employer name.', required: false }),
    account_id: aiProps.optionalId({ displayName: 'Account ID', description: 'Account ID from Search Accounts (field id) to link the contact to.' }),
    website_url: aiProps.text({ displayName: 'Company Website', description: 'Employer website URL.', required: false }),
    contact_stage_id: aiProps.optionalId({ displayName: 'Contact Stage ID', description: 'Stage ID from List Contact Stages (field id).' }),
    list_names: aiProps.textList({ displayName: 'List Names', description: 'Names of contact lists to add the contact to. Apollo creates a list for any name that does not exist; check List Lists first.', required: false }),
    direct_phone: aiProps.text({ displayName: 'Direct Phone', description: 'Direct phone number.', required: false }),
    mobile_phone: aiProps.text({ displayName: 'Mobile Phone', description: 'Mobile phone number.', required: false }),
    present_raw_address: aiProps.text({ displayName: 'Location', description: 'Where the person lives, e.g. "Austin, Texas".', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'contact' }),
  },
  outputSchema: apolloOutputSchemas.contactCreated,
  async run({ propsValue, auth }) {
    const mode = apolloInputs.requireText({ value: propsValue.if_match_exists, label: 'If a Matching Contact Exists' });
    if (mode !== 'update_existing' && mode !== 'always_create') {
      throw new Error('If a Matching Contact Exists must be update_existing or always_create.');
    }
    const listNames = apolloInputs.stringList(propsValue.list_names);
    const body = apolloInputs.compact({
      first_name: apolloInputs.optionalText(propsValue.first_name),
      last_name: apolloInputs.optionalText(propsValue.last_name),
      email: apolloInputs.optionalText(propsValue.email),
      title: apolloInputs.optionalText(propsValue.title),
      organization_name: apolloInputs.optionalText(propsValue.organization_name),
      account_id: apolloInputs.optionalText(propsValue.account_id),
      website_url: apolloInputs.optionalText(propsValue.website_url),
      contact_stage_id: apolloInputs.optionalText(propsValue.contact_stage_id),
      label_names: listNames.length > 0 ? listNames : undefined,
      direct_phone: apolloInputs.optionalText(propsValue.direct_phone),
      mobile_phone: apolloInputs.optionalText(propsValue.mobile_phone),
      present_raw_address: apolloInputs.optionalText(propsValue.present_raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
      run_dedupe: mode === 'update_existing',
    });
    if (body['first_name'] === undefined && body['last_name'] === undefined && body['email'] === undefined) {
      throw new Error('Give at least a first name, last name or email.');
    }
    const response = await apolloRequests.createContact({ apiKey: apiKeyOf(auth), body });
    const contact = apolloMappers.contact(response['contact']);
    const wasExisting = typeof response['was_existing'] === 'boolean' ? response['was_existing'] : null;
    const dedupe = wasExisting === null ? null : { found_existing: wasExisting, existing_contact_id: wasExisting ? contact['id'] : null };
    const created = wasExisting === null ? (mode === 'always_create' ? true : null) : !wasExisting;
    return { contact, created, dedupe };
  },
});
