import { OutputSchema } from '@activepieces/pieces-framework';

const addressFields: OutputSchema['fields'] = [
  { key: 'text', label: 'Address Text' },
  {
    key: 'value',
    label: 'Addresses',
    labelKey: 'address',
    listItems: [
      { key: 'address', label: 'Email', format: 'email' },
      { key: 'name', label: 'Name' },
    ],
  },
];

const recipientListItems: OutputSchema['fields'] = [
  { key: 'address', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
];

const emailSummaryFields: OutputSchema['fields'] = [
  { key: 'uid', label: 'Message UID', format: 'number' },
  { key: 'message_id', label: 'Message-ID' },
  { key: 'in_reply_to', label: 'In Reply To' },
  { key: 'subject', label: 'Subject' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'internal_date', label: 'Received At', format: 'datetime' },
  { key: 'from_name', label: 'From Name' },
  { key: 'from_address', label: 'From Email', format: 'email' },
  { key: 'to', label: 'To', labelKey: 'address', listItems: recipientListItems },
  { key: 'cc', label: 'Cc', labelKey: 'address', listItems: recipientListItems },
  { key: 'flags', label: 'Flags' },
  { key: 'seen', label: 'Read', format: 'boolean' },
  { key: 'flagged', label: 'Flagged', format: 'boolean' },
  { key: 'answered', label: 'Answered', format: 'boolean' },
  { key: 'size', label: 'Size', format: 'filesize' },
];

const transferFields: OutputSchema['fields'] = [
  { key: 'source_folder', label: 'Source Folder' },
  { key: 'source_uid_validity', label: 'Source UID Validity' },
  {
    key: 'target_uid_validity',
    label: 'Target UID Validity',
    description: 'Present only when the server supports UIDPLUS.',
  },
  {
    key: 'results',
    label: 'Results',
    labelKey: 'uid',
    listItems: [
      { key: 'uid', label: 'Original UID', format: 'number' },
      {
        key: 'new_uid',
        label: 'New UID',
        format: 'number',
        description: 'UID in the target folder. Present only when the server supports UIDPLUS.',
      },
    ],
  },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'not_found_uids', label: 'UIDs Not Found' },
];

const specialDestinationFields: OutputSchema['fields'] = [
  { key: 'destination_folder', label: 'Destination Folder' },
  {
    key: 'special_use_source',
    label: 'Special-Use Source',
    description:
      'extension when the server flags the folder, name when the role was guessed from the folder name.',
  },
];

export const newEmailTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'from', label: 'From', children: addressFields },
    { key: 'to', label: 'To', children: addressFields },
    { key: 'replyTo', label: 'Reply To', children: addressFields },
    { key: 'text', label: 'Text Body' },
    { key: 'html', label: 'HTML Body', format: 'html' },
    { key: 'textAsHtml', label: 'Text Body as HTML', format: 'html' },
    { key: 'messageId', label: 'Message ID' },
    { key: 'uid', label: 'Message UID', format: 'number' },
    {
      key: 'attachments',
      label: 'Attachments',
      description:
        'Stored attachment references, one per attachment — each a signed download URL produced by writing the attachment to file storage. Pass an entry straight to an action that accepts a file or a URL; the original filename and content type are not carried here.',
    },
    {
      key: 'headerLines',
      label: 'Header Lines',
      labelKey: 'key',
      listItems: [
        { key: 'key', label: 'Header Name' },
        { key: 'line', label: 'Raw Header Line' },
      ],
    },
  ],
};

export const copyEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'newUid',
      label: 'New Message UID',
      format: 'number',
      description: 'UID of the copy in the target folder.',
    },
  ],
};

export const moveEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'newUid',
      label: 'New Message UID',
      format: 'number',
      description:
        'UID of the message in the target folder. Absent when the server does not report a new UID.',
    },
  ],
};

export const markEmailReadActionOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const deleteEmailActionOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const listFoldersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'folders',
      label: 'Folders',
      labelKey: 'path',
      listItems: [
        { key: 'path', label: 'Path' },
        { key: 'name', label: 'Name' },
        { key: 'delimiter', label: 'Delimiter' },
        { key: 'parent_path', label: 'Parent Path' },
        { key: 'special_use', label: 'Special Use' },
        { key: 'special_use_source', label: 'Special-Use Source' },
        { key: 'flags', label: 'Flags' },
        { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
        {
          key: 'messages',
          label: 'Messages',
          format: 'number',
          description: 'Present only when Include Message Counts is on.',
        },
        {
          key: 'unseen',
          label: 'Unread',
          format: 'number',
          description: 'Present only when Include Message Counts is on.',
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getFolderStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Path' },
    { key: 'messages', label: 'Messages', format: 'number' },
    { key: 'unseen', label: 'Unread', format: 'number' },
    { key: 'recent', label: 'Recent', format: 'number' },
    { key: 'uid_next', label: 'Next UID', format: 'number' },
    { key: 'uid_validity', label: 'UID Validity' },
    {
      key: 'highest_modseq',
      label: 'Highest Mod-Sequence',
      description: 'Present only when the server supports CONDSTORE.',
    },
  ],
};

export const createFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Path' },
    {
      key: 'created',
      label: 'Created',
      format: 'boolean',
      description: 'False when the folder already existed.',
    },
  ],
};

export const renameFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Old Path' },
    { key: 'new_path', label: 'New Path' },
  ],
};

export const deleteFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Path' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const getQuotaOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Path' },
    { key: 'has_quota', label: 'Has Quota', format: 'boolean' },
    { key: 'storage_used_bytes', label: 'Storage Used', format: 'filesize' },
    { key: 'storage_limit_bytes', label: 'Storage Limit', format: 'filesize' },
    { key: 'messages_used', label: 'Messages Used', format: 'number' },
    { key: 'messages_limit', label: 'Messages Limit', format: 'number' },
  ],
};

export const searchEmailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder' },
    { key: 'uid_validity', label: 'UID Validity' },
    { key: 'total_matches', label: 'Total Matches', format: 'number' },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'emails', label: 'Emails', labelKey: 'subject', listItems: emailSummaryFields },
  ],
};

export const getEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder' },
    { key: 'uid', label: 'Message UID', format: 'number' },
    { key: 'uid_validity', label: 'UID Validity' },
    { key: 'message_id', label: 'Message-ID' },
    { key: 'in_reply_to', label: 'In Reply To' },
    { key: 'references', label: 'References' },
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date', format: 'datetime' },
    { key: 'internal_date', label: 'Received At', format: 'datetime' },
    { key: 'from_name', label: 'From Name' },
    { key: 'from_address', label: 'From Email', format: 'email' },
    { key: 'to', label: 'To', labelKey: 'address', listItems: recipientListItems },
    { key: 'cc', label: 'Cc', labelKey: 'address', listItems: recipientListItems },
    { key: 'bcc', label: 'Bcc', labelKey: 'address', listItems: recipientListItems },
    { key: 'reply_to', label: 'Reply To', labelKey: 'address', listItems: recipientListItems },
    { key: 'text', label: 'Text Body' },
    { key: 'html', label: 'HTML Body', format: 'html' },
    { key: 'flags', label: 'Flags' },
    { key: 'seen', label: 'Read', format: 'boolean' },
    { key: 'flagged', label: 'Flagged', format: 'boolean' },
    { key: 'size', label: 'Size', format: 'filesize' },
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'filename',
      listItems: [
        { key: 'filename', label: 'File Name' },
        { key: 'content_type', label: 'Content Type' },
        { key: 'size', label: 'Size', format: 'filesize' },
        {
          key: 'file',
          label: 'File',
          description: 'Stored file reference; pass it to any action that accepts a file.',
        },
      ],
    },
  ],
};

export const updateEmailFlagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder' },
    { key: 'uid_validity', label: 'UID Validity' },
    {
      key: 'emails',
      label: 'Emails',
      labelKey: 'uid',
      listItems: [
        { key: 'uid', label: 'Message UID', format: 'number' },
        { key: 'flags', label: 'Flags' },
        { key: 'seen', label: 'Read', format: 'boolean' },
        { key: 'flagged', label: 'Flagged', format: 'boolean' },
        { key: 'answered', label: 'Answered', format: 'boolean' },
      ],
    },
    { key: 'not_found_uids', label: 'UIDs Not Found' },
  ],
};

export const moveEmailsOutputSchema: OutputSchema = {
  fields: [...transferFields, { key: 'target_folder', label: 'Target Folder' }],
};

export const copyEmailsOutputSchema: OutputSchema = {
  fields: [...transferFields, { key: 'target_folder', label: 'Target Folder' }],
};

export const trashEmailsOutputSchema: OutputSchema = {
  fields: [...transferFields, ...specialDestinationFields],
};

export const archiveEmailsOutputSchema: OutputSchema = {
  fields: [...transferFields, ...specialDestinationFields],
};

export const deleteEmailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder' },
    { key: 'deleted_uids', label: 'Deleted UIDs' },
    {
      key: 'not_deleted_uids',
      label: 'UIDs Not Deleted',
      description: 'UIDs that still exist after the delete.',
    },
    { key: 'not_found_uids', label: 'UIDs Not Found' },
  ],
};

export const createDraftOutputSchema: OutputSchema = {
  fields: [
    { key: 'folder', label: 'Folder' },
    {
      key: 'uid',
      label: 'Draft UID',
      format: 'number',
      description: 'UID of the saved draft, when the server reports it.',
    },
    { key: 'uid_validity', label: 'UID Validity' },
    { key: 'message_id', label: 'Message-ID' },
  ],
};
