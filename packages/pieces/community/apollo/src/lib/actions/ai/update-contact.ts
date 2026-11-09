import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiUpdateContactAction = createAction({
  auth: apolloAuth,
  name: 'ai_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Change fields on a saved contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one contact in your Apollo CRM by contact ID; only the fields you give are sent and the rest keep their value. Change the stage with contact_stage_id. List membership is not changed here; use Add Records to List or Remove Records from List. Uses no credits.',
    idempotent: true,
  },
  props: {
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Contact ID from Search Contacts or Find Contact by Email (field id).' }),
    first_name: aiProps.text({ displayName: 'First Name', description: 'New first name.', required: false }),
    last_name: aiProps.text({ displayName: 'Last Name', description: 'New last name.', required: false }),
    email: aiProps.text({ displayName: 'Email', description: 'New email address.', required: false }),
    title: aiProps.text({ displayName: 'Job Title', description: 'New job title.', required: false }),
    organization_name: aiProps.text({ displayName: 'Company Name', description: 'New employer name.', required: false }),
    account_id: aiProps.optionalId({ displayName: 'Account ID', description: 'Account ID from Search Accounts (field id).' }),
    website_url: aiProps.text({ displayName: 'Company Website', description: 'New employer website.', required: false }),
    contact_stage_id: aiProps.optionalId({ displayName: 'Contact Stage ID', description: 'Stage ID from List Contact Stages (field id).' }),
    direct_phone: aiProps.text({ displayName: 'Direct Phone', description: 'New direct phone.', required: false }),
    mobile_phone: aiProps.text({ displayName: 'Mobile Phone', description: 'New mobile phone.', required: false }),
    present_raw_address: aiProps.text({ displayName: 'Location', description: 'New location.', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'contact' }),
  },
  outputSchema: apolloOutputSchemas.contact,
  async run({ propsValue, auth }) {
    const contactId = apolloInputs.requireText({ value: propsValue.contact_id, label: 'Contact ID' });
    const body = apolloInputs.compact({
      first_name: apolloInputs.optionalText(propsValue.first_name),
      last_name: apolloInputs.optionalText(propsValue.last_name),
      email: apolloInputs.optionalText(propsValue.email),
      title: apolloInputs.optionalText(propsValue.title),
      organization_name: apolloInputs.optionalText(propsValue.organization_name),
      account_id: apolloInputs.optionalText(propsValue.account_id),
      website_url: apolloInputs.optionalText(propsValue.website_url),
      contact_stage_id: apolloInputs.optionalText(propsValue.contact_stage_id),
      direct_phone: apolloInputs.optionalText(propsValue.direct_phone),
      mobile_phone: apolloInputs.optionalText(propsValue.mobile_phone),
      present_raw_address: apolloInputs.optionalText(propsValue.present_raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to change.');
    }
    const response = await apolloRequests.updateContact({ apiKey: apiKeyOf(auth), contactId, body });
    return { contact: apolloMappers.contact(response['contact']) };
  },
});
