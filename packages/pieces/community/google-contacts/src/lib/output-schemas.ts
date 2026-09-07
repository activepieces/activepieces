import { OutputSchema } from '@activepieces/pieces-framework';

// Google People returns every contact detail as a repeated field: a contact can hold several
// names, emails, phone numbers and organizations, each carrying its own `metadata`. Only the
// `metadata.primary` flag is surfaced from that block -- the rest (source ids, per-field etags)
// is server bookkeeping that says nothing about the contact.
const nameFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'givenName', label: 'First Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'familyName', label: 'Last Name' },
  { key: 'displayNameLastFirst', label: 'Display Name (Last, First)' },
  { key: 'unstructuredName', label: 'Unstructured Name' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const emailFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Email Address', format: 'email' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const phoneFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Phone Number' },
  // Google normalises to E.164 here; the raw `value` keeps whatever the user typed.
  { key: 'canonicalForm', label: 'Canonical Form' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const organizationFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Company' },
  { key: 'title', label: 'Job Title' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const photoFields: OutputSchema['fields'] = [
  { key: 'url', label: 'Photo URL', format: 'image' },
  // True when this is Google's generated placeholder rather than a photo the contact has.
  { key: 'default', label: 'Is Placeholder', format: 'boolean' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const membershipFields: OutputSchema['fields'] = [
  {
    key: 'contactGroupId',
    label: 'Contact Group ID',
    value: 'contactGroupMembership.contactGroupId',
  },
  {
    key: 'contactGroupResourceName',
    label: 'Contact Group Resource Name',
    value: 'contactGroupMembership.contactGroupResourceName',
  },
];

const metadataFields: OutputSchema['fields'] = [
  { key: 'objectType', label: 'Object Type' },
  {
    key: 'sources',
    label: 'Sources',
    labelKey: 'updateTime',
    listItems: [
      { key: 'type', label: 'Source Type' },
      { key: 'id', label: 'Source ID' },
      // The only timestamp on a contact, and what the polling trigger orders and dedupes on.
      { key: 'updateTime', label: 'Last Updated', format: 'datetime' },
    ],
  },
];

// One person record. Shared by every action and the trigger, because People returns the same
// shape whether the contact was just created, just updated, matched by a search, or polled.
const personFields: OutputSchema['fields'] = [
  // `people/{person_id}` -- the id Update Contact requires.
  { key: 'resourceName', label: 'Resource Name' },
  // Required alongside resourceName on update; the call is rejected if the contact moved on.
  { key: 'etag', label: 'ETag' },
  { key: 'names', label: 'Names', labelKey: 'displayName', listItems: nameFields },
  {
    key: 'emailAddresses',
    label: 'Email Addresses',
    labelKey: 'value',
    listItems: emailFields,
  },
  {
    key: 'phoneNumbers',
    label: 'Phone Numbers',
    labelKey: 'value',
    listItems: phoneFields,
  },
  {
    key: 'organizations',
    label: 'Organizations',
    labelKey: 'name',
    listItems: organizationFields,
  },
  { key: 'photos', label: 'Photos', labelKey: 'url', listItems: photoFields },
  {
    key: 'memberships',
    label: 'Group Memberships',
    // labelKey resolves by dot path against the raw item, so it has to name the nested
    // property rather than the flattened key used in membershipFields.
    labelKey: 'contactGroupMembership.contactGroupId',
    listItems: membershipFields,
  },
  { key: 'metadata', label: 'Metadata', children: metadataFields },
];

export const addContactOutputSchema: OutputSchema = {
  fields: personFields,
};

export const updateContactOutputSchema: OutputSchema = {
  fields: personFields,
};

// searchContacts wraps each hit as `{ person: {...} }` under a `results` array, so the person
// fields sit one level deeper than they do on the other three steps. Which of them are actually
// populated follows the caller's Read Mask -- the default is names and email addresses only.
export const searchContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Matching Contacts',
      listItems: [
        { key: 'person', label: 'Contact', children: personFields },
      ],
    },
  ],
};

// The polling trigger emits one person per run, so its payload is a person record directly.
export const newOrUpdatedContactOutputSchema: OutputSchema = {
  fields: personFields,
};
