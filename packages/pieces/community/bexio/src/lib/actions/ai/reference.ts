import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioGetCurrentUser = createAction({
  auth: bexioAuth,
  name: 'bexio_get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Get the Bexio user of this connection.',
  audience: 'ai',
  aiMetadata: { description: 'Returns the Bexio user behind this connection. Use its id as user_id or owner_id when creating contacts, items, documents, projects and timesheets. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.userOutputSchema,
  props: {
  },
  async run({ auth }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/3.0/users/me` });
  },
});

export const bexioListUsers = createAction({
  auth: bexioAuth,
  name: 'bexio_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List users of the Bexio company in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists users of the Bexio company in Bexio. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.userListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/3.0/users`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioListCountries = createAction({
  auth: bexioAuth,
  name: 'bexio_list_countries',
  classification: 'SEARCH',
  displayName: 'List Countries',
  description: 'List countries in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists countries in Bexio; pass order_by=id_desc for newest first. Use the IDs as country_id on contacts. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.countryListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/country`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioSearchCountries = createAction({
  auth: bexioAuth,
  name: 'bexio_search_countries',
  classification: 'SEARCH',
  displayName: 'Search Countries',
  description: 'Search countries in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds countries matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.countryListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'name, name_short' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/country/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListLanguages = createAction({
  auth: bexioAuth,
  name: 'bexio_list_languages',
  classification: 'SEARCH',
  displayName: 'List Languages',
  description: 'List languages in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists languages in Bexio; pass order_by=id_desc for newest first. Use the IDs as language_id. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.languageListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/language`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListPaymentTypes = createAction({
  auth: bexioAuth,
  name: 'bexio_list_payment_types',
  classification: 'SEARCH',
  displayName: 'List Payment Types',
  description: 'List payment types in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists payment types in Bexio; pass order_by=id_desc for newest first. Use the IDs as payment_type_id on documents. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/payment_type`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetPermissions = createAction({
  auth: bexioAuth,
  name: 'bexio_get_permissions',
  classification: 'READ',
  displayName: 'Get Permissions',
  description: 'Get the activated modules and permissions of this connection.',
  audience: 'ai',
  aiMetadata: { description: 'Returns the activated Bexio modules and the permissions of the connected user. Use it to check whether a feature is available before calling it. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.permissionsOutputSchema,
  props: {
  },
  async run({ auth }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/3.0/permissions` });
  },
});
