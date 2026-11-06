import { OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';

function identifyByProp({ action }: { action: string }) {
  return Property.StaticDropdown({
    displayName: 'Identify Contact By',
    description: `Loops accepts exactly one identifier to ${action}.`,
    required: true,
    defaultValue: 'email',
    options: {
      disabled: false,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'User ID', value: 'userId' },
      ],
    },
  });
}

function identifierValueProp() {
  return Property.ShortText({
    displayName: 'Email or User ID',
    description: 'The email address or user ID of the contact, matching "Identify Contact By".',
    required: true,
  });
}

function subscribedProp({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Subscribed to Marketing',
    description,
    required: false,
    defaultValue: 'default',
    options: {
      disabled: false,
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Subscribed', value: 'true' },
        { label: 'Unsubscribed', value: 'false' },
      ],
    },
  });
}

function contactDetailProps() {
  return {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name.",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name.",
      required: false,
    }),
    userGroup: Property.ShortText({
      displayName: 'User Group',
      description: 'A group/segment to assign to this contact.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where this contact came from (e.g. "signup-form", "import").',
      required: false,
    }),
    mailingLists: Property.Object({
      displayName: 'Mailing Lists',
      description:
        'Mailing list IDs as keys with `true` (subscribe) or `false` (unsubscribe) as values. Use "List Mailing Lists" to find the IDs.',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description:
        'Additional contact properties as key-value pairs. Use "List Contact Properties" to find the keys. Reserved fields (email, firstName, lastName, userId, subscribed, userGroup, source, mailingLists) are ignored here.',
      required: false,
    }),
  };
}

function idempotencyKeyProp() {
  return Property.ShortText({
    displayName: 'Idempotency Key',
    description:
      'Optional unique key (up to 100 characters). Loops rejects a repeat request with the same key within 24 hours, so retries do not send twice.',
    required: false,
  });
}

function contactFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Contact ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'userId', label: 'User ID' },
    { key: 'source', label: 'Source' },
    { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
    { key: 'userGroup', label: 'User Group' },
    { key: 'optInStatus', label: 'Opt-in Status' },
    { key: 'mailingLists', label: 'Mailing Lists' },
  ];
}

export const loopsProps = {
  identifyByProp,
  identifierValueProp,
  subscribedProp,
  contactDetailProps,
  idempotencyKeyProp,
};

export const loopsSchemas: Record<LoopsSchemaName, OutputSchema> = {
  successWithId: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'id', label: 'Contact ID' },
    ],
  },
  success: {
    fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
  },
  successWithMessage: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
    ],
  },
  contactList: {
    fields: [
      { key: 'contacts', label: 'Contacts', listItems: contactFields(), labelKey: 'email' },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  singleContact: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'contact', label: 'Contact', children: contactFields() },
    ],
  },
  mailingLists: {
    fields: [
      {
        key: 'lists',
        label: 'Mailing Lists',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'List ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'isPublic', label: 'Public', format: 'boolean' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  contactProperties: {
    fields: [
      {
        key: 'properties',
        label: 'Properties',
        labelKey: 'label',
        listItems: [
          { key: 'key', label: 'Key' },
          { key: 'label', label: 'Label' },
          { key: 'type', label: 'Type' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  transactionalEmails: {
    fields: [
      {
        key: 'emails',
        label: 'Transactional Emails',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Transactional ID' },
          { key: 'name', label: 'Name' },
          { key: 'dataVariables', label: 'Data Variables' },
          { key: 'publishedEmailMessageId', label: 'Published Message ID' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'nextCursor', label: 'Next Cursor' },
    ],
  },
  suppression: {
    fields: [
      {
        key: 'contact',
        label: 'Contact',
        children: [
          { key: 'id', label: 'Contact ID' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'userId', label: 'User ID' },
        ],
      },
      { key: 'isSuppressed', label: 'Suppressed', format: 'boolean' },
      {
        key: 'removalQuota',
        label: 'Removal Quota',
        children: [
          { key: 'limit', label: 'Limit', format: 'number' },
          { key: 'remaining', label: 'Remaining', format: 'number' },
        ],
      },
    ],
  },
};

type LoopsSchemaName =
  | 'successWithId'
  | 'success'
  | 'successWithMessage'
  | 'contactList'
  | 'singleContact'
  | 'mailingLists'
  | 'contactProperties'
  | 'transactionalEmails'
  | 'suppression';
