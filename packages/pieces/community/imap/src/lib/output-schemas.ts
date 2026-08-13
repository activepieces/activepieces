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
        'UID of the message in the target folder. Absent when the server reports no new UID, in which case Success is false.',
    },
  ],
};
