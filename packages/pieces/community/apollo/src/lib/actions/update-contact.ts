import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, recordsOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const updateContactAction = createAction({
  auth: apolloAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Change fields on an existing Apollo contact. Empty fields are left unchanged.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the fields you fill in on one Apollo contact picked from a dropdown; empty fields are not sent and keep their saved value. List membership is not changed here. Uses no credits.',
    idempotent: true,
  },
  props: {
    contact_id: apolloProps.contact({ required: true, description: 'Contact to update. Type a name or email to search, or map a contact ID.' }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    organization_name: Property.ShortText({ displayName: 'Company Name', required: false }),
    account_id: apolloProps.account({ required: false, description: 'Account (saved company) to link the contact to. Type to search.' }),
    website_url: Property.ShortText({ displayName: 'Company Website', required: false }),
    contact_stage_id: apolloProps.contactStage({ required: false }),
    direct_phone: Property.ShortText({ displayName: 'Direct Phone', required: false }),
    mobile_phone: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
    corporate_phone: Property.ShortText({ displayName: 'Corporate Phone', required: false }),
    present_raw_address: Property.ShortText({ displayName: 'Location', required: false }),
    typed_custom_fields: apolloProps.customFields({ modality: 'contact' }),
  },
  outputSchema: apolloOutputSchemas.humanContact,
  async run({ propsValue, auth }) {
    const contactId = apolloInputs.requireText({ value: propsValue.contact_id, label: 'Contact' });
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
      corporate_phone: apolloInputs.optionalText(propsValue.corporate_phone),
      present_raw_address: apolloInputs.optionalText(propsValue.present_raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    const response = await apolloRequests.updateContact({ apiKey: apiKeyOf(auth), contactId, body });
    return { contact: apolloMappers.contact(response['contact']), labels: recordsOf(response['labels']).map((label) => apolloMappers.list(label)) };
  },
});
