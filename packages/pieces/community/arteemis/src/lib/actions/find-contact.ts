import { createAction, Property } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { arteemisApi } from '../common/client';
import { flattenObject } from '../common/events';

type ContactRecord = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  linkedinUrl?: string | null;
  currentTitle?: string | null;
  organizationName?: string | null;
  currentCompany?: string | null;
  companyDomain?: string | null;
  location?: string | null;
  leadStatus?: string | null;
  replyKind?: string | null;
  customFields?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const findContact = createAction({
  auth: arteemisAuth,
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Finds a contact by email or LinkedIn profile URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up one Arteemis contact by email, else by LinkedIn profile URL, the way Arteemis deduplicates contacts. Returns found false when nobody matches; use Create or Update Contact to create the person then.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Looked up first, e.g. `claire.martin@example.com`.',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Used when no contact has the email, e.g. `https://www.linkedin.com/in/claire-martin`.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const entry = arteemisApi.filled({ email: context.propsValue.email, linkedin_url: context.propsValue.linkedin_url });
    if (Object.keys(entry).length === 0) {
      throw new Error('Give an email or a LinkedIn profile URL to look for.');
    }
    // match looks the email up first, then the LinkedIn profile, the way Arteemis deduplicates contacts.
    const { data: matched } = await arteemisApi.call<{ rows: { contact_id: string | null }[] }>({
      apiKey,
      tool: 'contacts_query',
      body: { match: [{ kind: 'person', ...entry }] },
    });
    const contactId = matched.rows[0]?.contact_id;
    if (!contactId) {
      return { found: false };
    }
    const { data: record } = await arteemisApi.call<ContactRecord>({
      apiKey,
      tool: 'contacts_get',
      body: { contact_id: contactId },
    });
    return {
      found: true,
      id: record.id,
      name: record.name ?? null,
      first_name: record.firstName ?? null,
      last_name: record.lastName ?? null,
      email: record.email ?? null,
      phone: record.phoneNumber ?? null,
      linkedin_url: record.linkedinUrl ?? null,
      title: record.currentTitle ?? null,
      company: record.organizationName || record.currentCompany || null,
      company_domain: record.companyDomain ?? null,
      location: record.location ?? null,
      lead_status: record.leadStatus ?? null,
      reply_kind: record.replyKind ?? null,
      created_at: record.createdAt ?? null,
      updated_at: record.updatedAt ?? null,
      ...flattenObject(record.customFields ?? {}, 'custom_fields'),
    };
  },
});
