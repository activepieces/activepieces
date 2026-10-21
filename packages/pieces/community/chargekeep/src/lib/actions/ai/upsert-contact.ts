import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../../auth';
import { chargekeepClient } from '../../common/client';
import { contactCommon } from '../../common/contact';
import { chargekeepOutputSchemas } from '../../common/output-schemas';
import { chargekeepServices } from '../../common/services';

const CONTACT_TYPES = ['Lead', 'Client', 'Partner'];

function customFields(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (!chargekeepClient.isRecord(value)) throw new Error('Custom Fields must be an object like {"customField1": "value"}.');
  const allowed = ['customField1', 'customField2', 'customField3', 'customField4', 'customField5'];
  const unknown = Object.keys(value).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) throw new Error(`Unknown custom field keys: ${unknown.join(', ')}. Use customField1 to customField5.`);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, v === null || v === undefined ? undefined : String(v)]));
}

export const upsertContact = createAction({
  auth: chargekeepAuth,
  name: 'upsert_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Create a contact, or update it when it matches an existing one.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates or updates one contact in ChargeKeep/Sperse CRM (import). contactType is Lead (default), Client or Partner. To update a known contact pass contactId or contactXref; otherwise matchExisting (default true) matches on email and name, and a new contact is created when nothing matches. Needs at least one of firstName, lastName, companyName or email. Empty fields are not sent, so they never clear existing values. Does not create a portal user or send any email. Returns contactId and leadId.',
    idempotent: true,
  },
  outputSchema: chargekeepOutputSchemas.importedContact,
  props: {
    contactType: Property.ShortText({ displayName: 'Contact Type', description: 'Lead, Client or Partner. Defaults to Lead.', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'ID of an existing contact to update.', required: false }),
    contactXref: Property.ShortText({ displayName: 'Contact XREF', description: 'Your external ID for the contact; sending it again updates the same contact.', required: false }),
    matchExisting: Property.Checkbox({ displayName: 'Match Existing', description: 'Match an existing contact by email and name. Defaults to true.', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', description: 'Personal email.', required: false }),
    workEmail: Property.ShortText({ displayName: 'Work Email', required: false }),
    mobilePhone: Property.ShortText({ displayName: 'Mobile Phone', required: false }),
    workPhone: Property.ShortText({ displayName: 'Work Phone', required: false }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
    street: Property.ShortText({ displayName: 'Street', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    stateId: Property.ShortText({ displayName: 'State Code', description: 'e.g. TX', required: false }),
    zip: Property.ShortText({ displayName: 'Zip', required: false }),
    countryId: Property.ShortText({ displayName: 'Country Code', description: 'ISO 3166-1 alpha-2, e.g. US', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    assignedUser: Property.ShortText({ displayName: 'Assigned User', description: 'Email of the ChargeKeep user to assign.', required: false }),
    leadSource: Property.ShortText({ displayName: 'Source Code', required: false }),
    affiliateCode: Property.ShortText({ displayName: 'Affiliate Code', required: false }),
    customFields: Property.Json({ displayName: 'Custom Fields', description: 'Object with keys customField1 to customField5.', required: false }),
  },
  async run({ auth, propsValue: p }) {
    const contactType = chargekeepClient.text(p.contactType) ?? 'Lead';
    if (!CONTACT_TYPES.includes(contactType)) throw new Error(`Contact Type must be one of ${CONTACT_TYPES.join(', ')}.`);
    const contactId = chargekeepClient.positiveId({ value: p.contactId, label: 'Contact ID' });
    contactCommon.assertIdentity({ firstName: p.firstName, lastName: p.lastName, companyName: p.companyName, emails: [p.email, p.workEmail], contactId, contactXref: p.contactXref });
    const { mapped } = await chargekeepServices.importContact({
      auth,
      body: {
        importType: contactType,
        matchExisting: p.matchExisting !== false,
        createUser: false,
        sendWelcomeEmail: false,
        contactId,
        contactXref: chargekeepClient.text(p.contactXref),
        personalInfo: {
          fullName: { firstName: chargekeepClient.text(p.firstName), lastName: chargekeepClient.text(p.lastName) },
          email1: chargekeepClient.text(p.email),
          mobilePhone: chargekeepClient.text(p.mobilePhone),
          fullAddress: { street: chargekeepClient.text(p.street), city: chargekeepClient.text(p.city), stateId: chargekeepClient.text(p.stateId), zip: chargekeepClient.text(p.zip), countryId: chargekeepClient.text(p.countryId) },
          webSiteUrl: chargekeepClient.text(p.website),
          customFields: customFields(p.customFields),
        },
        businessInfo: {
          companyName: chargekeepClient.text(p.companyName),
          jobTitle: chargekeepClient.text(p.jobTitle),
          workEmail1: chargekeepClient.text(p.workEmail),
          workPhone1: chargekeepClient.text(p.workPhone),
        },
        notes: chargekeepClient.text(p.notes),
        assignedUser: chargekeepClient.text(p.assignedUser),
        leadSource: chargekeepClient.text(p.leadSource),
        affiliateCode: chargekeepClient.text(p.affiliateCode),
      },
    });
    return mapped();
  },
});
