import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isLemlistStatus, lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

function updateStrategyProp() {
  return Property.StaticDropdown({
    displayName: 'Update Strategy',
    description:
      'For an existing record: overwriteIgnoreEmpty (default) replaces stored values with the ones sent, fillEmptyOnly only fills empty fields, overwrite also clears fields sent empty.',
    required: false,
    options: {
      disabled: false,
      options: ['overwriteIgnoreEmpty', 'fillEmptyOnly', 'overwrite'].map((value) => ({ label: value, value })),
    },
  });
}

function upsertBody({
  record,
  keys,
  identityKeys,
  updateStrategy,
}: {
  record: Record<string, unknown>;
  keys: readonly string[];
  identityKeys: readonly string[];
  updateStrategy: unknown;
}): Record<string, unknown> {
  const picked = lemlistInput.pick({ record, keys });
  const body = lemlistInput.compact(picked);
  if (updateStrategy === 'overwrite') {
    for (const [key, value] of Object.entries(picked)) {
      if (!identityKeys.includes(key) && typeof value === 'string' && value.trim().length === 0) {
        body[key] = '';
      }
    }
  }
  return body;
}

function contactPath(value: unknown): string {
  return `/contacts/${lemlistInput.contactIdOrEmailSegment({ value, label: 'Contact ID or Email' })}`;
}

function companyPath(value: unknown): string {
  return `/companies/${lemlistInput.idSegment({ value, label: 'Company ID', prefix: 'cpn' })}`;
}

function notesPage({
  body,
  page,
  limit,
}: {
  body: unknown;
  page: number;
  limit: number;
}) {
  const items = lemlistResults.listFrom({ body });
  const total = lemlistResults.numberField({ body, key: 'total' }) ?? items.length;
  return { items, total, page, has_more: page * limit < total };
}

export const upsertContactAction = createAction({
  auth: lemlistAuth,
  name: 'upsert_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Creates a CRM contact or updates the one with the same email or LinkedIn URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a lemlist CRM contact, or updates the existing one matched by email or LinkedIn URL (one of them is required). Does not add the contact to any campaign. Returns the contact ID and whether it was created or updated. Idempotent: the same input updates the same contact.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    linkedinUrl: Property.ShortText({ displayName: 'LinkedIn URL', required: false }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    companyDomain: Property.ShortText({ displayName: 'Company Domain', required: false }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    update_strategy: updateStrategyProp(),
  },
  outputSchema: lemlistSchemas.upsertResult,
  async run({ auth, propsValue }) {
    const { update_strategy } = propsValue;
    const body = upsertBody({
      record: propsValue,
      keys: ['email', 'linkedinUrl', 'firstName', 'lastName', 'jobTitle', 'phone', 'companyDomain', 'location'],
      identityKeys: ['email', 'linkedinUrl'],
      updateStrategy: update_strategy,
    });
    if (body['email'] === undefined && body['linkedinUrl'] === undefined) {
      throw new Error('Provide an Email or a LinkedIn URL to identify the contact.');
    }
    if (body['email'] !== undefined) {
      body['email'] = lemlistInput.email({ value: body['email'], label: 'Email' });
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/contacts',
      query: { updateStrategy: update_strategy ?? undefined },
      body,
    });
  },
});

export const getContactAction = createAction({
  auth: lemlistAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Returns a CRM contact by ID or email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one lemlist CRM contact by contact ID or email: fields, campaigns it is in (with lead IDs and states), owner and unsubscribed flag. found=false when no contact matches. Read-only.',
    idempotent: true,
  },
  props: {
    contact: Property.ShortText({ displayName: 'Contact ID or Email', required: true }),
  },
  outputSchema: lemlistSchemas.contactLookup,
  async run({ auth, propsValue }) {
    const value = lemlistInput.requireText({ value: propsValue.contact, label: 'Contact ID or Email' });
    try {
      if (value.includes('@')) {
        const matches = await lemlistApiCall<unknown>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/contacts',
          query: { idsOrEmails: lemlistInput.email({ value, label: 'Contact ID or Email' }) },
        });
        const contact = Array.isArray(matches) && matches.length > 0 ? matches[0] : null;
        return { found: contact !== null, contact };
      }
      const contact = await lemlistApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        resourceUri: contactPath(value),
      });
      return { found: true, contact };
    } catch (error) {
      if (isLemlistStatus({ error, status: 404 })) {
        return { found: false, contact: null };
      }
      throw error;
    }
  },
});

export const listContactsAction = createAction({
  auth: lemlistAuth,
  name: 'list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'Lists or searches CRM contacts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists lemlist CRM contacts, optionally searched by name text (2+ characters) or filtered by company ID (cpn_...) or contact list ID (clt_...). Limit 1-500 (default 100) and Offset; has_more=true means call again with Offset + Limit. Use Get Contact to look up one email. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    company_id: Property.ShortText({ displayName: 'Company ID', required: false }),
    list_id: Property.ShortText({ displayName: 'Contact List ID', required: false }),
    limit: aiProps.limit({ max: 500, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.contactPage,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 500 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const search = lemlistInput.optionalText(propsValue.search);
    if (search !== undefined && search.length < 2) {
      throw new Error('Search must be at least 2 characters.');
    }
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/contacts',
      query: {
        search,
        companyId: lemlistInput.optionalText(propsValue.company_id),
        listId: lemlistInput.optionalText(propsValue.list_id),
        limit,
        offset,
      },
    });
    return lemlistResults.page({ items: lemlistResults.listFrom({ body }), offset, limit });
  },
});

export const createContactNoteAction = createAction({
  auth: lemlistAuth,
  name: 'create_contact_note',
  classification: 'WRITE',
  displayName: 'Create Contact Note',
  description: 'Adds a note to a CRM contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Writes a note on one lemlist contact (contact ID or email); it is also pushed to the connected CRM. Not idempotent: each run adds another note.',
    idempotent: false,
  },
  props: {
    contact: Property.ShortText({ displayName: 'Contact ID or Email', required: true }),
    note: Property.LongText({ displayName: 'Note', required: true }),
  },
  outputSchema: lemlistSchemas.note,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `${contactPath(propsValue.contact)}/notes`,
      body: { note: lemlistInput.requireText({ value: propsValue.note, label: 'Note' }) },
    });
  },
});

export const listContactNotesAction = createAction({
  auth: lemlistAuth,
  name: 'list_contact_notes',
  classification: 'SEARCH',
  displayName: 'List Contact Notes',
  description: 'Lists the notes of a CRM contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists notes on one lemlist contact (contact ID or email), newest first. Page starts at 1, Limit 1-100 (default 100); has_more=true means ask for the next Page. Read-only.',
    idempotent: true,
  },
  props: {
    contact: Property.ShortText({ displayName: 'Contact ID or Email', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    limit: aiProps.limit({ max: 100, fallback: 100 }),
  },
  outputSchema: lemlistSchemas.notePage,
  async run({ auth, propsValue }) {
    const page = lemlistInput.boundedInt({ value: propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `${contactPath(propsValue.contact)}/notes`,
      query: { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return notesPage({ body, page, limit });
  },
});

export const upsertCompanyAction = createAction({
  auth: lemlistAuth,
  name: 'upsert_company',
  classification: 'WRITE',
  displayName: 'Create or Update Company',
  description: 'Creates a CRM company or updates the one with the same domain or LinkedIn URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a lemlist CRM company, or updates the existing one matched by domain or LinkedIn URL (one of them is required). Returns the company ID and whether it was created or updated. Idempotent: the same input updates the same company.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({ displayName: 'Domain', required: false }),
    linkedinUrl: Property.ShortText({ displayName: 'LinkedIn URL', required: false }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    size: Property.ShortText({ displayName: 'Size', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    update_strategy: updateStrategyProp(),
  },
  outputSchema: lemlistSchemas.upsertResult,
  async run({ auth, propsValue }) {
    const { update_strategy } = propsValue;
    const body = upsertBody({
      record: propsValue,
      keys: ['domain', 'linkedinUrl', 'name', 'industry', 'location', 'size', 'description'],
      identityKeys: ['domain', 'linkedinUrl'],
      updateStrategy: update_strategy,
    });
    if (body['domain'] === undefined && body['linkedinUrl'] === undefined) {
      throw new Error('Provide a Domain or a LinkedIn URL to identify the company.');
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/companies',
      query: { updateStrategy: update_strategy ?? undefined },
      body,
    });
  },
});

export const getCompanyAction = createAction({
  auth: lemlistAuth,
  name: 'get_company',
  classification: 'READ',
  displayName: 'Get Company',
  description: 'Returns a CRM company by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one lemlist CRM company by company ID (cpn_...): domain, LinkedIn URL, fields and owner. Read-only.',
    idempotent: true,
  },
  props: {
    company_id: Property.ShortText({ displayName: 'Company ID', required: true }),
  },
  outputSchema: lemlistSchemas.company,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: companyPath(propsValue.company_id),
    });
  },
});

export const listCompaniesAction = createAction({
  auth: lemlistAuth,
  name: 'list_companies',
  classification: 'SEARCH',
  displayName: 'List Companies',
  description: 'Lists or searches CRM companies.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists lemlist CRM companies, optionally searched by name or fetched by comma-separated IDs/domains. Limit 1-500 (default 100) and Offset; has_more=true means call again with Offset + Limit. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search by Name', required: false }),
    ids_or_domains: Property.ShortText({
      displayName: 'IDs or Domains',
      description: 'Comma-separated company IDs or domains (max 100).',
      required: false,
    }),
    limit: aiProps.limit({ max: 500, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.companyPage,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 500 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const idsOrDomains = lemlistInput.optionalText(propsValue.ids_or_domains);
    const ids =
      idsOrDomains === undefined
        ? undefined
        : lemlistInput.stringList({ value: idsOrDomains, label: 'IDs or Domains' });
    if (ids !== undefined && ids.length > 100) {
      throw new Error('IDs or Domains accepts at most 100 values.');
    }
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/companies',
      query: {
        search: lemlistInput.optionalText(propsValue.search),
        idsOrDomains: ids?.join(','),
        limit,
        offset,
      },
    });
    const items = lemlistResults.listFrom({ body });
    return ids === undefined
      ? lemlistResults.page({ items, offset, limit })
      : { items, count: items.length, offset: 0, has_more: false };
  },
});

export const createCompanyNoteAction = createAction({
  auth: lemlistAuth,
  name: 'create_company_note',
  classification: 'WRITE',
  displayName: 'Create Company Note',
  description: 'Adds a note to a CRM company.',
  audience: 'ai',
  aiMetadata: {
    description: 'Writes a note on one lemlist company (cpn_...). Not idempotent: each run adds another note.',
    idempotent: false,
  },
  props: {
    company_id: Property.ShortText({ displayName: 'Company ID', required: true }),
    note: Property.LongText({ displayName: 'Note', required: true }),
  },
  outputSchema: lemlistSchemas.note,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `${companyPath(propsValue.company_id)}/notes`,
      body: { note: lemlistInput.requireText({ value: propsValue.note, label: 'Note' }) },
    });
  },
});

export const listCompanyNotesAction = createAction({
  auth: lemlistAuth,
  name: 'list_company_notes',
  classification: 'SEARCH',
  displayName: 'List Company Notes',
  description: 'Lists the notes of a CRM company.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists notes on one lemlist company (cpn_...), newest first. Page starts at 1, Limit 1-100 (default 100); has_more=true means ask for the next Page. Read-only.',
    idempotent: true,
  },
  props: {
    company_id: Property.ShortText({ displayName: 'Company ID', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
    limit: aiProps.limit({ max: 100, fallback: 100 }),
  },
  outputSchema: lemlistSchemas.notePage,
  async run({ auth, propsValue }) {
    const page = lemlistInput.boundedInt({ value: propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `${companyPath(propsValue.company_id)}/notes`,
      query: { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return notesPage({ body, page, limit });
  },
});
