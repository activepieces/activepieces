import { OutputSchema } from '@activepieces/pieces-framework';

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
  { key: 'canonicalForm', label: 'Canonical Form' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const nicknameFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Nickname' },
  { key: 'primary', label: 'Primary', value: 'metadata.primary', format: 'boolean' },
];

const biographyFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Notes' },
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
      { key: 'updateTime', label: 'Last Updated', format: 'datetime' },
    ],
  },
];

const personFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
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
    labelKey: 'contactGroupMembership.contactGroupId',
    listItems: membershipFields,
  },
  { key: 'metadata', label: 'Metadata', children: metadataFields },
];

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

const contactGroupSummaryFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'etag', label: 'ETag' },
  { key: 'name', label: 'Name' },
  { key: 'formattedName', label: 'Formatted Name' },
  { key: 'groupType', label: 'Group Type' },
  { key: 'memberCount', label: 'Member Count', format: 'number' },
  { key: 'memberResourceNames', label: 'Member Resource Names' },
];

const batchFailureFields: OutputSchema['fields'] = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'status', label: 'Failure Reason' },
];

const batchCreateFailureFields: OutputSchema['fields'] = [
  { key: 'requestIndex', label: 'Request Index', format: 'number' },
  { key: 'status', label: 'Failure Reason' },
];

export const addContactOutputSchema: OutputSchema = {
  fields: personFields,
};

export const updateContactOutputSchema: OutputSchema = {
  fields: personFields,
};

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

export const batchDeleteContactsOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'resourceNames', label: 'Resource Names' },
    { key: 'count', label: 'Count', format: 'number' },
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
        { key: 'requestIndex', label: 'Request Index', format: 'number' },
        { key: 'resourceName', label: 'Resource Name' },
        { key: 'contact', label: 'Contact', children: contactSummaryFields },
      ],
    },
    {
      key: 'failed',
      label: 'Failures',
      labelKey: 'requestIndex',
      listItems: batchCreateFailureFields,
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
    { key: 'updateMask', label: 'Update Mask' },
  ],
};

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
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
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
    { key: 'deletedContacts', label: 'Contacts Also Deleted', format: 'boolean' },
  ],
};

export const modifyContactGroupMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceName', label: 'Contact Group Resource Name' },
    { key: 'added', label: 'Added Contacts' },
    { key: 'removed', label: 'Removed Contacts' },
    { key: 'notFoundResourceNames', label: 'Not Found Contacts' },
    {
      key: 'canNotRemoveLastContactGroupResourceNames',
      label: 'Cannot Remove Last Group',
    },
  ],
};
