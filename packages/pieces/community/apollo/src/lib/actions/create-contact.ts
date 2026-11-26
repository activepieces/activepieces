import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf, recordsOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const createContactAction = createAction({
  auth: apolloAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Save a person as a contact in your Apollo workspace.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a contact in the Apollo CRM with name, email, company, stage, phones and lists picked from dropdowns. Without "Update if a matching contact exists" every run creates a new contact; with it, Apollo updates the matching contact instead. Uses no credits.',
    idempotent: false,
  },
  props: {
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    organization_name: Property.ShortText({ displayName: 'Company Name', required: false }),
    account_id: apolloProps.account({ required: false, description: 'Account (saved company) to link the contact to. Type to search.' }),
    website_url: Property.ShortText({ displayName: 'Company Website', required: false }),
    contact_stage_id: apolloProps.contactStage({ required: false }),
    label_names: apolloProps.lists({ modality: 'contacts' }),
    direct_phone: Property.ShortText({ displayName: 'Direct Phone', required: false }),
    mobile_phone: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
    corporate_phone: Property.ShortText({ displayName: 'Corporate Phone', required: false }),
    present_raw_address: Property.ShortText({ displayName: 'Location', description: 'Where the person lives, e.g. "Austin, Texas".', required: false }),
    typed_custom_fields: apolloProps.customFields({ modality: 'contact' }),
    run_dedupe: Property.Checkbox({
      displayName: 'Update if a matching contact exists',
      description: 'Apollo looks for a contact with the same email (or name and company) and updates it with the values above instead of creating a duplicate. Empty fields can clear saved values on the match.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: apolloOutputSchemas.humanContact,
  async run({ propsValue, auth }) {
    const body = apolloInputs.compact({
      first_name: apolloInputs.optionalText(propsValue.first_name),
      last_name: apolloInputs.optionalText(propsValue.last_name),
      email: apolloInputs.optionalText(propsValue.email),
      title: apolloInputs.optionalText(propsValue.title),
      organization_name: apolloInputs.optionalText(propsValue.organization_name),
      account_id: apolloInputs.optionalText(propsValue.account_id),
      website_url: apolloInputs.optionalText(propsValue.website_url),
      contact_stage_id: apolloInputs.optionalText(propsValue.contact_stage_id),
      label_names: emptyToUndefined(apolloInputs.stringList(propsValue.label_names)),
      direct_phone: apolloInputs.optionalText(propsValue.direct_phone),
      mobile_phone: apolloInputs.optionalText(propsValue.mobile_phone),
      corporate_phone: apolloInputs.optionalText(propsValue.corporate_phone),
      present_raw_address: apolloInputs.optionalText(propsValue.present_raw_address),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
      run_dedupe: propsValue.run_dedupe === true ? true : undefined,
    });
    if (body['first_name'] === undefined && body['last_name'] === undefined && body['email'] === undefined) {
      throw new Error('Enter at least a first name, last name or email for the contact.');
    }
    const response = await apolloRequests.createContact({ apiKey: apiKeyOf(auth), body });
    return { contact: apolloMappers.contact(response['contact']), labels: recordsOf(response['labels']).map((label) => apolloMappers.list(label)) };
  },
});

function emptyToUndefined(list: string[]): string[] | undefined {
  return list.length === 0 ? undefined : list;
}
