import { OutputSchema } from '@activepieces/pieces-framework';

const emailAddressFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name', value: 'emailAddress.name' },
  { key: 'address', label: 'Email Address', value: 'emailAddress.address', format: 'email' },
];

const messageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Message ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'bodyPreview', label: 'Body Preview' },
  {
    key: 'body',
    label: 'Body',
    children: [
      { key: 'contentType', label: 'Content Type' },
      { key: 'content', label: 'Content' },
    ],
  },
  { key: 'from', label: 'From', children: emailAddressFields },
  { key: 'sender', label: 'Sender', children: emailAddressFields },
  { key: 'toRecipients', label: 'To Recipients', labelKey: 'address', listItems: emailAddressFields },
  { key: 'ccRecipients', label: 'CC Recipients', labelKey: 'address', listItems: emailAddressFields },
  { key: 'bccRecipients', label: 'BCC Recipients', labelKey: 'address', listItems: emailAddressFields },
  { key: 'replyTo', label: 'Reply To', labelKey: 'address', listItems: emailAddressFields },
  { key: 'receivedDateTime', label: 'Received At', format: 'datetime' },
  { key: 'sentDateTime', label: 'Sent At', format: 'datetime' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  { key: 'hasAttachments', label: 'Has Attachments', format: 'boolean' },
  { key: 'isRead', label: 'Is Read', format: 'boolean' },
  { key: 'isDraft', label: 'Is Draft', format: 'boolean' },
  { key: 'importance', label: 'Importance' },
  { key: 'categories', label: 'Categories' },
  { key: 'flag', label: 'Flag', children: [{ key: 'flagStatus', label: 'Flag Status' }] },
  { key: 'webLink', label: 'Web Link', format: 'url' },
  { key: 'parentFolderId', label: 'Parent Folder ID' },
  { key: 'conversationId', label: 'Conversation ID' },
  { key: 'internetMessageId', label: 'Internet Message ID' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
  { key: 'file', label: 'File', format: 'url' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'isInline', label: 'Is Inline', format: 'boolean' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
];

const dispatchResultFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'message', label: 'Message' },
  { key: 'messageId', label: 'Message ID' },
];

export const messageActionOutputSchema: OutputSchema = { fields: messageFields };

export const draftMessageActionOutputSchema: OutputSchema = {
  fields: messageFields.filter((field) => field.key !== 'from' && field.key !== 'sender'),
};

export const findEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'totalCount', label: 'Total Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextPageUrl', label: 'Next Page URL', format: 'url' },
    { key: 'result', label: 'Emails', labelKey: 'subject', listItems: messageFields },
  ],
};

export const downloadAttachmentActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'attachments', label: 'Attachments', value: '', listItems: attachmentFields }],
};

export const sendDraftEmailActionOutputSchema: OutputSchema = { fields: dispatchResultFields };

export const forwardEmailActionOutputSchema: OutputSchema = { fields: dispatchResultFields };

export const replyEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'draftId', label: 'Draft ID' },
    { key: 'draftLink', label: 'Draft Link', format: 'url' },
  ],
};

export const requestApprovalActionOutputSchema: OutputSchema = {
  fields: [{ key: 'approved', label: 'Approved', format: 'boolean' }],
};

export const newEmailTriggerOutputSchema: OutputSchema = { fields: messageFields };

export const newAttachmentTriggerOutputSchema: OutputSchema = {
  fields: [
    ...attachmentFields,
    { key: 'messageId', label: 'Message ID' },
    { key: 'messageSubject', label: 'Message Subject' },
    { key: 'messageSender', label: 'Message Sender', children: emailAddressFields },
    { key: 'messageReceivedDateTime', label: 'Message Received At', format: 'datetime' },
    { key: 'parentFolderId', label: 'Parent Folder ID' },
  ],
};
