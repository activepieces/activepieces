import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bexioAuth } from '../../auth';
import { bexioAi } from '../../common/ai-helpers';
import { bexioOutputSchemas } from '../../common/output-schemas';

export const bexioListContacts = createAction({
  auth: bexioAuth,
  name: 'bexio_list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'List contacts (companies and persons) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists contacts (companies and persons) in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
    show_archived: bexioAi.flagProp({ displayName: 'Show Archived', description: 'Set to yes to return ONLY archived contacts instead of active ones. Leave empty for active contacts.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/contact`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by, extra: { show_archived: propsValue.show_archived === 'yes' ? 'true' : undefined } });
  },
});

export const bexioSearchContacts = createAction({
  auth: bexioAuth,
  name: 'bexio_search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Search contacts in Bexio by field criteria.',
  audience: 'ai',
  aiMetadata: { description: 'Finds contacts matching one or two field criteria (operators like, =, >, in, is_null, ...). Use this to resolve an ID by name or number. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactListOutputSchema,
  props: {
    ...bexioAi.searchProps({ fieldsHint: 'id, name_1, name_2, nr, address, mail, mail_second, postcode, city, country_id, contact_group_ids, contact_type_id (1 company, 2 person), updated_at, user_id, phone_fixed, phone_mobile, fax' }),
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.search({ auth, path: `/2.0/contact/search`, criteria: bexioAi.searchCriteria({ values: propsValue }), limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioGetContact = createAction({
  auth: bexioAuth,
  name: 'bexio_get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get a single contact by ID.',
  audience: 'ai',
  aiMetadata: { description: 'Fetches one contact by its numeric ID with all fields. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactOutputSchema,
  props: {
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Numeric contact ID. Find it with bexio_search_contacts or bexio_list_contacts.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.GET, path: `/2.0/contact/${bexioAi.pathId({ value: propsValue.contact_id, label: 'Contact ID' })}` });
  },
});

export const bexioCreateContact = createAction({
  auth: bexioAuth,
  name: 'bexio_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a company or person contact.',
  audience: 'ai',
  aiMetadata: { description: 'Creates a company (contact type 1) or person (contact type 2) contact. Needs the responsible user_id and owner_id from bexio_get_current_user. Search first with bexio_search_contacts to avoid duplicates; each call creates a new contact.', idempotent: false },
  outputSchema: bexioOutputSchemas.contactOutputSchema,
  props: {
    nr: Property.ShortText({ displayName: 'Number', description: 'If set to null, the number will be assigned automatically. Must be a number, can also be used as integer', required: false }),
    contact_type_id: Property.StaticDropdown<string>({ displayName: 'Contact Type', description: 'Company or person.', required: true, options: { disabled: false, options: [{ label: 'Company', value: '1' }, { label: 'Person', value: '2' }] } }),
    name_1: Property.ShortText({ displayName: 'Name 1', description: 'Company name, or the last name of a person.', required: true }),
    name_2: Property.ShortText({ displayName: 'Name 2', description: 'Company addition, or the first name of a person.', required: false }),
    salutation_id: Property.ShortText({ displayName: 'Salutation ID', description: 'Salutation ID from bexio_list_salutations.', required: false }),
    salutation_form: Property.Number({ displayName: 'Salutation Form', description: 'Salutation form ID (letter greeting style).', required: false }),
    title_id: Property.ShortText({ displayName: 'Title ID', description: 'Title ID from bexio_list_titles.', required: false }),
    birthday: Property.ShortText({ displayName: 'Birthday', description: 'Format YYYY-MM-DD.', required: false }),
    street_name: Property.ShortText({ displayName: 'Street Name', description: 'Is required if house_number or address_addition are not NULL', required: false }),
    house_number: Property.ShortText({ displayName: 'House Number', description: 'Requires street_name if the value is not NULL', required: false }),
    address_addition: Property.ShortText({ displayName: 'Address Addition', description: 'Requires street_name if the value is not NULL', required: false }),
    postcode: Property.ShortText({ displayName: 'Postcode', description: 'Postal code.', required: false }),
    city: Property.ShortText({ displayName: 'City', description: 'City.', required: false }),
    country_id: Property.ShortText({ displayName: 'Country ID', description: 'Country ID from bexio_list_countries or bexio_search_countries.', required: false }),
    mail: Property.ShortText({ displayName: 'Mail', description: 'Main email address.', required: false }),
    mail_second: Property.ShortText({ displayName: 'Mail Second', description: 'Second email address.', required: false }),
    phone_fixed: Property.ShortText({ displayName: 'Phone Fixed', description: 'Landline phone number.', required: false }),
    phone_fixed_second: Property.ShortText({ displayName: 'Phone Fixed Second', description: 'Second landline phone number.', required: false }),
    phone_mobile: Property.ShortText({ displayName: 'Phone Mobile', description: 'Mobile phone number.', required: false }),
    fax: Property.ShortText({ displayName: 'Fax', description: 'Fax number.', required: false }),
    url: Property.ShortText({ displayName: 'URL', description: 'Website address.', required: false }),
    skype_name: Property.ShortText({ displayName: 'Skype Name', description: 'Skype name.', required: false }),
    remarks: Property.LongText({ displayName: 'Remarks', description: 'Internal remarks.', required: false }),
    language_id: Property.ShortText({ displayName: 'Language ID', description: 'Language ID from bexio_list_languages.', required: false }),
    contact_group_ids: Property.ShortText({ displayName: 'Contact Group IDs', description: 'Contact group IDs from bexio_list_contact_groups. Comma-separated numeric IDs, e.g. 1,2.', required: false }),
    contact_branch_ids: Property.ShortText({ displayName: 'Contact Branch IDs', description: 'Contact sector IDs from bexio_list_contact_sectors. Comma-separated numeric IDs, e.g. 1,2.', required: false }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Bexio user responsible for the record. Get it from bexio_get_current_user or bexio_list_users.', required: true }),
    owner_id: Property.ShortText({ displayName: 'Owner ID', description: 'Bexio user who owns the record. Get it from bexio_get_current_user or bexio_list_users.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/contact`, body: bexioAi.buildBody({ values: propsValue, fields: { nr: 'text', contact_type_id: 'id', name_1: 'text', name_2: 'text', salutation_id: 'id', salutation_form: 'number', title_id: 'id', birthday: 'text', street_name: 'text', house_number: 'text', address_addition: 'text', postcode: 'text', city: 'text', country_id: 'id', mail: 'text', mail_second: 'text', phone_fixed: 'text', phone_fixed_second: 'text', phone_mobile: 'text', fax: 'text', url: 'text', skype_name: 'text', remarks: 'text', language_id: 'id', contact_group_ids: 'idCsv', contact_branch_ids: 'idCsv', user_id: 'id', owner_id: 'id' } }) });
  },
});

export const bexioUpdateContact = createAction({
  auth: bexioAuth,
  name: 'bexio_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update fields on an existing contact.',
  audience: 'ai',
  aiMetadata: { description: 'Changes only the given fields on an existing contact (company or person); omitted fields keep their value. To empty a field, name it in clear_fields (nr there restores automatic numbering). Required fields Bexio needs on edit are read from the current contact. Safe to retry.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactOutputSchema,
  props: {
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Numeric contact ID. Find it with bexio_search_contacts or bexio_list_contacts.', required: true }),
    nr: Property.ShortText({ displayName: 'Number', description: 'New contact number. Leave empty to keep the current one; to switch back to automatic numbering, put nr in Fields to Clear.', required: false }),
    contact_type_id: Property.StaticDropdown<string>({ displayName: 'Contact Type', description: 'Change between company and person. Leave empty to keep it.', required: false, options: { disabled: false, options: [{ label: 'Company', value: '1' }, { label: 'Person', value: '2' }] } }),
    name_1: Property.ShortText({ displayName: 'Name 1', description: 'Company name, or the last name of a person.', required: false }),
    name_2: Property.ShortText({ displayName: 'Name 2', description: 'Company addition, or the first name of a person.', required: false }),
    salutation_id: Property.ShortText({ displayName: 'Salutation ID', description: 'Salutation ID from bexio_list_salutations.', required: false }),
    salutation_form: Property.Number({ displayName: 'Salutation Form', description: 'Salutation form ID (letter greeting style).', required: false }),
    title_id: Property.ShortText({ displayName: 'Title ID', description: 'Title ID from bexio_list_titles.', required: false }),
    birthday: Property.ShortText({ displayName: 'Birthday', description: 'Format YYYY-MM-DD.', required: false }),
    street_name: Property.ShortText({ displayName: 'Street Name', description: 'Is required if house_number or address_addition are not NULL', required: false }),
    house_number: Property.ShortText({ displayName: 'House Number', description: 'Requires street_name if the value is not NULL', required: false }),
    address_addition: Property.ShortText({ displayName: 'Address Addition', description: 'Requires street_name if the value is not NULL', required: false }),
    postcode: Property.ShortText({ displayName: 'Postcode', description: 'Postal code.', required: false }),
    city: Property.ShortText({ displayName: 'City', description: 'City.', required: false }),
    country_id: Property.ShortText({ displayName: 'Country ID', description: 'Country ID from bexio_list_countries or bexio_search_countries.', required: false }),
    mail: Property.ShortText({ displayName: 'Mail', description: 'Main email address.', required: false }),
    mail_second: Property.ShortText({ displayName: 'Mail Second', description: 'Second email address.', required: false }),
    phone_fixed: Property.ShortText({ displayName: 'Phone Fixed', description: 'Landline phone number.', required: false }),
    phone_fixed_second: Property.ShortText({ displayName: 'Phone Fixed Second', description: 'Second landline phone number.', required: false }),
    phone_mobile: Property.ShortText({ displayName: 'Phone Mobile', description: 'Mobile phone number.', required: false }),
    fax: Property.ShortText({ displayName: 'Fax', description: 'Fax number.', required: false }),
    url: Property.ShortText({ displayName: 'URL', description: 'Website address.', required: false }),
    skype_name: Property.ShortText({ displayName: 'Skype Name', description: 'Skype name.', required: false }),
    remarks: Property.LongText({ displayName: 'Remarks', description: 'Internal remarks.', required: false }),
    language_id: Property.ShortText({ displayName: 'Language ID', description: 'Language ID from bexio_list_languages.', required: false }),
    contact_group_ids: Property.ShortText({ displayName: 'Contact Group IDs', description: 'Contact group IDs from bexio_list_contact_groups. Comma-separated numeric IDs, e.g. 1,2.', required: false }),
    contact_branch_ids: Property.ShortText({ displayName: 'Contact Branch IDs', description: 'Contact sector IDs from bexio_list_contact_sectors. Comma-separated numeric IDs, e.g. 1,2.', required: false }),
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Bexio user responsible for the record. Get it from bexio_get_current_user or bexio_list_users.', required: false }),
    owner_id: Property.ShortText({ displayName: 'Owner ID', description: 'Bexio user who owns the record. Get it from bexio_get_current_user or bexio_list_users.', required: false }),
    clear_fields: bexioAi.clearProp({ allowed: ['nr', 'name_2', 'salutation_id', 'salutation_form', 'title_id', 'birthday', 'street_name', 'house_number', 'address_addition', 'postcode', 'city', 'country_id', 'mail', 'mail_second', 'phone_fixed', 'phone_fixed_second', 'phone_mobile', 'fax', 'url', 'skype_name', 'remarks', 'language_id', 'contact_group_ids', 'contact_branch_ids'] }),
  },
  async run({ auth, propsValue }) {
    const body = await bexioAi.fillRequired({ auth, getPath: `/2.0/contact/${bexioAi.pathId({ value: propsValue.contact_id, label: 'Contact ID' })}`, body: bexioAi.clearFields({ value: propsValue.clear_fields, allowed: ['nr', 'name_2', 'salutation_id', 'salutation_form', 'title_id', 'birthday', 'street_name', 'house_number', 'address_addition', 'postcode', 'city', 'country_id', 'mail', 'mail_second', 'phone_fixed', 'phone_fixed_second', 'phone_mobile', 'fax', 'url', 'skype_name', 'remarks', 'language_id', 'contact_group_ids', 'contact_branch_ids'], body: bexioAi.buildBody({ values: propsValue, fields: { nr: 'text', contact_type_id: 'id', name_1: 'text', name_2: 'text', salutation_id: 'id', salutation_form: 'number', title_id: 'id', birthday: 'text', street_name: 'text', house_number: 'text', address_addition: 'text', postcode: 'text', city: 'text', country_id: 'id', mail: 'text', mail_second: 'text', phone_fixed: 'text', phone_fixed_second: 'text', phone_mobile: 'text', fax: 'text', url: 'text', skype_name: 'text', remarks: 'text', language_id: 'id', contact_group_ids: 'idCsv', contact_branch_ids: 'idCsv', user_id: 'id', owner_id: 'id' } }) }), required: ['contact_type_id', 'name_1', 'user_id', 'owner_id'] });
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/contact/${bexioAi.pathId({ value: propsValue.contact_id, label: 'Contact ID' })}`, body });
  },
});

export const bexioDeleteContact = createAction({
  auth: bexioAuth,
  name: 'bexio_delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Delete a contact (soft delete).',
  audience: 'ai',
  aiMetadata: { description: 'Marks a contact as deleted in Bexio. It disappears from lists and searches; bexio_restore_contact brings it back. A second call on the same contact fails.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Numeric contact ID. Find it with bexio_search_contacts or bexio_list_contacts.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.DELETE, path: `/2.0/contact/${bexioAi.pathId({ value: propsValue.contact_id, label: 'Contact ID' })}` });
  },
});

export const bexioRestoreContact = createAction({
  auth: bexioAuth,
  name: 'bexio_restore_contact',
  classification: 'WRITE',
  displayName: 'Restore Contact',
  description: 'Restore a deleted contact.',
  audience: 'ai',
  aiMetadata: { description: 'Restores a contact previously deleted with bexio_delete_contact.', idempotent: false },
  outputSchema: bexioOutputSchemas.successOutputSchema,
  props: {
    contact_id: bexioAi.idProp({ displayName: 'Contact ID', description: 'Numeric contact ID. Find it with bexio_search_contacts or bexio_list_contacts.', required: true }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.PATCH, path: `/2.0/contact/${bexioAi.pathId({ value: propsValue.contact_id, label: 'Contact ID' })}/restore` });
  },
});

export const bexioListContactGroups = createAction({
  auth: bexioAuth,
  name: 'bexio_list_contact_groups',
  classification: 'SEARCH',
  displayName: 'List Contact Groups',
  description: 'List contact groups in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists contact groups in Bexio; pass order_by=id_desc for newest first. Use the IDs in contact_group_ids on contacts. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactGroupListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/contact_group`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListContactSectors = createAction({
  auth: bexioAuth,
  name: 'bexio_list_contact_sectors',
  classification: 'SEARCH',
  displayName: 'List Contact Sectors',
  description: 'List contact sectors (branches) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists contact sectors (branches) in Bexio; pass order_by=id_desc for newest first. Use the IDs in contact_branch_ids on contacts. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/contact_branch`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListSalutations = createAction({
  auth: bexioAuth,
  name: 'bexio_list_salutations',
  classification: 'SEARCH',
  displayName: 'List Salutations',
  description: 'List salutations in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists salutations in Bexio. Use the IDs as salutation_id on persons. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({}),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/salutation`, limit: propsValue.limit, offset: propsValue.offset });
  },
});

export const bexioListTitles = createAction({
  auth: bexioAuth,
  name: 'bexio_list_titles',
  classification: 'SEARCH',
  displayName: 'List Titles',
  description: 'List titles in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists titles in Bexio; pass order_by=id_desc for newest first. Use the IDs as title_id on persons. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.namedListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/title`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioListContactRelations = createAction({
  auth: bexioAuth,
  name: 'bexio_list_contact_relations',
  classification: 'SEARCH',
  displayName: 'List Contact Relations',
  description: 'List contact relations (links between a company and its persons) in Bexio.',
  audience: 'ai',
  aiMetadata: { description: 'Lists contact relations (links between a company and its persons) in Bexio; pass order_by=id_desc for newest first. Returns one page plus has_more and next_offset; call again with next_offset to continue. Read-only.', idempotent: true },
  outputSchema: bexioOutputSchemas.contactRelationListOutputSchema,
  props: {
    ...bexioAi.listProps({ orderByHint: 'Sort field with optional _asc/_desc suffix, e.g. id_desc or updated_at_desc.' }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.list({ auth, path: `/2.0/contact_relation`, limit: propsValue.limit, offset: propsValue.offset, orderBy: propsValue.order_by });
  },
});

export const bexioCreateContactRelation = createAction({
  auth: bexioAuth,
  name: 'bexio_create_contact_relation',
  classification: 'WRITE',
  displayName: 'Create Contact Relation',
  description: 'Link two contacts.',
  audience: 'ai',
  aiMetadata: { description: 'Links two contacts, typically a person (contact_sub_id) to a company (contact_id). Each call creates another relation.', idempotent: false },
  outputSchema: bexioOutputSchemas.contactRelationOutputSchema,
  props: {
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Main contact ID (usually the company). Find it with bexio_search_contacts.', required: true }),
    contact_sub_id: Property.ShortText({ displayName: 'Contact Sub ID', description: 'Related contact ID (usually the person). Find it with bexio_search_contacts.', required: true }),
    description: Property.ShortText({ displayName: 'Description', description: 'Free-text description.', required: false }),
  },
  async run({ auth, propsValue }) {
    return bexioAi.request({ auth, method: HttpMethod.POST, path: `/2.0/contact_relation`, body: bexioAi.buildBody({ values: propsValue, fields: { contact_id: 'id', contact_sub_id: 'id', description: 'text' } }) });
  },
});
