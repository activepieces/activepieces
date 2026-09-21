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

const nicknameFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Nickname' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const biographyFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Notes' },
  // TEXT_PLAIN or TEXT_HTML; the piece always writes TEXT_PLAIN but reads whatever is stored.
  { key: 'contentType', label: 'Content Type' },
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
  { key: 'nicknames', label: 'Nicknames', labelKey: 'value', listItems: nicknameFields },
  { key: 'biographies', label: 'Notes', labelKey: 'value', listItems: biographyFields },
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

// The flattened contact that `summarizePerson` builds: one row per contact with the primary
// name, organization and update time lifted out of People's repeated-field structure. Emails
// and phone numbers are plain string arrays here, not objects.
const contactSummaryFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'etag', label: 'ETag' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'givenName', label: 'First Name' },
  { key: 'familyName', label: 'Last Name' },
  { key: 'emails', label: 'Email Addresses' },
  { key: 'phoneNumbers', label: 'Phone Numbers' },
  { key: 'company', label: 'Company' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'updateTime', label: 'Last Updated', format: 'datetime' },
];

// The flattened contact group that `summarizeGroup` builds. `memberResourceNames` is only
// populated when the caller asked for members (Max Members above zero); it is an empty array
// otherwise, and always empty on List Contact Groups.
const contactGroupSummaryFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
  // System groups carry no etag, so this is blank on contactGroups/myContacts and friends.
  { key: 'etag', label: 'ETag' },
  { key: 'name', label: 'Name' },
  { key: 'formattedName', label: 'Formatted Name' },
  { key: 'groupType', label: 'Group Type' },
  { key: 'memberCount', label: 'Member Count', format: 'number' },
  { key: 'memberResourceNames', label: 'Member Resource Names' },
];

// Every batch action splits its per-item responses the same way: a whole-call HTTP success can
// still carry per-item failures, so the failed collection is always surfaced next to the
// succeeded one with the reason Google gave for each rejected item.
const batchFailureFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'status', label: 'Failure Reason' },
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

export const createContactOutputSchema: OutputSchema = {
  fields: personFields,
};

export const getContactOutputSchema: OutputSchema = {
  fields: personFields,
};

export const updateContactFieldsOutputSchema: OutputSchema = {
  fields: personFields,
};

export const listContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'displayName',
      listItems: contactSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    // True when Google still had pages left after Max Results was reached.
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const searchContactsAtomicOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Matching Contacts',
      labelKey: 'displayName',
      listItems: contactSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const deleteContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'resourceName', label: 'Resource Name' },
  ],
};

export const batchGetContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'succeeded',
      label: 'Contacts Read',
      labelKey: 'contact.displayName',
      listItems: [
        { key: 'resourceName', label: 'Resource Name' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        // The untouched Person object; Batch Update Contacts takes these back verbatim.
        { key: 'person', label: 'Full Person', children: personFields },
      ],
    },
    {
      key: 'failed',
      label: 'Failures',
      labelKey: 'resourceName',
      listItems: batchFailureFields,
    },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
  ],
};

export const batchCreateContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'succeeded',
      label: 'Contacts Created',
      labelKey: 'contact.displayName',
      listItems: [
        // Created people have no requested resource name, so this is the created contact's own.
        { key: 'resourceName', label: 'Resource Name' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
      ],
    },
    {
      key: 'failed',
      label: 'Failures',
      labelKey: 'resourceName',
      listItems: batchFailureFields,
    },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
    { key: 'requestedCount', label: 'Requested Count', format: 'number' },
  ],
};

export const batchUpdateContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'succeeded',
      label: 'Contacts Updated',
      labelKey: 'contact.displayName',
      listItems: [
        { key: 'resourceName', label: 'Resource Name' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
        { key: 'person', label: 'Full Person', children: personFields },
      ],
    },
    {
      key: 'failed',
      label: 'Failures',
      labelKey: 'resourceName',
      listItems: batchFailureFields,
    },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
    // The single field mask derived from the submitted people and applied to all of them.
    { key: 'updateMask', label: 'Update Mask' },
  ],
};

// People answers both photo steps with `{ person: {...} }`, but the actions unwrap it so they
// return a bare Person like every other person-returning step in the piece.
export const updateContactPhotoOutputSchema: OutputSchema = {
  fields: personFields,
};

export const deleteContactPhotoOutputSchema: OutputSchema = {
  fields: personFields,
};

export const listContactGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'contactGroups',
      label: 'Contact Groups',
      labelKey: 'formattedName',
      listItems: contactGroupSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getContactGroupOutputSchema: OutputSchema = {
  fields: contactGroupSummaryFields,
};

export const updateContactGroupOutputSchema: OutputSchema = {
  fields: contactGroupSummaryFields,
};

export const batchGetContactGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'succeeded',
      label: 'Contact Groups Read',
      labelKey: 'formattedName',
      listItems: contactGroupSummaryFields,
    },
    {
      key: 'failed',
      label: 'Failures',
      labelKey: 'resourceName',
      listItems: batchFailureFields,
    },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
  ],
};

export const createContactGroupOutputSchema: OutputSchema = {
  fields: [
    // False when a group with that name already existed and was returned instead.
    { key: 'created', label: 'Created', format: 'boolean' },
    {
      key: 'contactGroup',
      label: 'Contact Group',
      children: contactGroupSummaryFields,
    },
  ],
};

export const deleteContactGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'resourceName', label: 'Resource Name' },
    // Mirrors the Also Delete Contacts input, so a run records whether members were removed too.
    { key: 'deletedContacts', label: 'Contacts Also Deleted', format: 'boolean' },
  ],
};

export const modifyContactGroupMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceName', label: 'Contact Group Resource Name' },
    { key: 'added', label: 'Added Contacts' },
    { key: 'removed', label: 'Removed Contacts' },
    { key: 'notFoundResourceNames', label: 'Not Found Contacts' },
    // Google refuses to strip a contact's last group membership; those names land here.
    {
      key: 'canNotRemoveLastContactGroupResourceNames',
      label: 'Cannot Remove Last Group',
    },
  ],
};
