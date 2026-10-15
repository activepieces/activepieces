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

const plainEmailAddressFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Email Address', format: 'email' },
];

const graphMessageFields: OutputSchema['fields'] = [
  ...messageFields,
  { key: 'inferenceClassification', label: 'Inference Classification' },
  { key: 'isReadReceiptRequested', label: 'Is Read Receipt Requested', format: 'boolean' },
  { key: 'isDeliveryReceiptRequested', label: 'Is Delivery Receipt Requested', format: 'boolean' },
];

const messageSummaryFields: OutputSchema['fields'] = messageFields.filter(
  (field) => field.key !== 'body',
);

const graphDraftMessageFields: OutputSchema['fields'] = graphMessageFields.filter(
  (field) => field.key !== 'from' && field.key !== 'sender',
);

const mailFolderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'parentFolderId', label: 'Parent Folder ID' },
  { key: 'childFolderCount', label: 'Child Folder Count', format: 'number' },
  { key: 'unreadItemCount', label: 'Unread Item Count', format: 'number' },
  { key: 'totalItemCount', label: 'Total Item Count', format: 'number' },
  { key: 'isHidden', label: 'Is Hidden', format: 'boolean' },
];

const fullMailFolderFields: OutputSchema['fields'] = [
  ...mailFolderFields,
  { key: 'sizeInBytes', label: 'Size', format: 'filesize' },
  { key: 'wellKnownName', label: 'Well-Known Name' },
];

const graphAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'isInline', label: 'Is Inline', format: 'boolean' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
];

const batchFailureFields: OutputSchema['fields'] = [
  { key: 'messageId', label: 'Message ID' },
  { key: 'status', label: 'HTTP Status', format: 'number' },
  { key: 'error', label: 'Error' },
];

const focusedInboxOverrideFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Override ID' },
  { key: 'classifyAs', label: 'Classify As' },
  { key: 'senderEmailAddress', label: 'Sender', children: plainEmailAddressFields },
];

const deltaRemovalFields: OutputSchema['fields'] = [
  { key: 'removed', label: 'Removed', format: 'boolean' },
  { key: 'removedReason', label: 'Removal Reason' },
];

const paginationFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
  { key: 'nextLink', label: 'Next Page URL', format: 'url' },
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

export const outlookMessageActionOutputSchema: OutputSchema = { fields: graphMessageFields };

export const outlookDraftMessageActionOutputSchema: OutputSchema = {
  fields: graphDraftMessageFields,
};

export const outlookListMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'messages', label: 'Messages', labelKey: 'subject', listItems: messageSummaryFields },
    ...paginationFields,
  ],
};

export const outlookSearchMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'messages', label: 'Messages', labelKey: 'subject', listItems: graphMessageFields },
    ...paginationFields,
  ],
};

export const outlookListMessagesDeltaActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'changes',
      label: 'Changed Messages',
      labelKey: 'subject',
      listItems: [...messageSummaryFields, ...deltaRemovalFields],
    },
    ...paginationFields,
    { key: 'deltaLink', label: 'Delta Link', format: 'url' },
  ],
};

export const outlookGetMessageMimeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'messageId', label: 'Message ID' },
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const outlookMoveMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'newMessageId', label: 'New Message ID' },
    { key: 'previousMessageId', label: 'Previous Message ID' },
    { key: 'destinationFolderId', label: 'Destination Folder ID' },
    { key: 'message', label: 'Message', children: graphMessageFields },
  ],
};

export const outlookCopyMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'newMessageId', label: 'New Message ID' },
    { key: 'sourceMessageId', label: 'Source Message ID' },
    { key: 'destinationFolderId', label: 'Destination Folder ID' },
    { key: 'message', label: 'Message', children: graphMessageFields },
  ],
};

export const outlookBatchMoveMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'destinationFolderId', label: 'Destination Folder ID' },
    { key: 'requestedCount', label: 'Requested Count', format: 'number' },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
    {
      key: 'succeeded',
      label: 'Succeeded',
      labelKey: 'newMessageId',
      listItems: [
        { key: 'messageId', label: 'Previous Message ID' },
        { key: 'newMessageId', label: 'New Message ID' },
      ],
    },
    { key: 'failed', label: 'Failed', labelKey: 'messageId', listItems: batchFailureFields },
  ],
};

export const outlookBatchUpdateMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'requestedCount', label: 'Requested Count', format: 'number' },
    { key: 'succeededCount', label: 'Succeeded Count', format: 'number' },
    { key: 'failedCount', label: 'Failed Count', format: 'number' },
    {
      key: 'succeeded',
      label: 'Succeeded',
      labelKey: 'messageId',
      listItems: [{ key: 'messageId', label: 'Message ID' }],
    },
    { key: 'failed', label: 'Failed', labelKey: 'messageId', listItems: batchFailureFields },
  ],
};

export const outlookDeleteMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Result Message' },
    { key: 'messageId', label: 'Message ID' },
  ],
};

export const outlookListMessageAttachmentsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'messageId', label: 'Message ID' },
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'name',
      listItems: [
        ...graphAttachmentFields,
        { key: 'attachmentType', label: 'Attachment Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const outlookGetMessageAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    ...graphAttachmentFields,
    { key: 'attachmentType', label: 'Attachment Type' },
    { key: 'messageId', label: 'Message ID' },
  ],
};

export const outlookDownloadMessageAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'attachmentId', label: 'Attachment ID' },
    { key: 'messageId', label: 'Message ID' },
  ],
};

export const outlookAddMessageAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    ...graphAttachmentFields,
    { key: 'attachmentType', label: 'Attachment Type' },
    { key: 'messageId', label: 'Message ID' },
  ],
};

export const outlookDeleteMessageAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Result Message' },
    { key: 'messageId', label: 'Message ID' },
    { key: 'attachmentId', label: 'Attachment ID' },
  ],
};

export const outlookMailFolderActionOutputSchema: OutputSchema = { fields: mailFolderFields };

export const outlookFullMailFolderActionOutputSchema: OutputSchema = {
  fields: fullMailFolderFields,
};

export const outlookListMailFoldersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'folders', label: 'Folders', labelKey: 'displayName', listItems: mailFolderFields },
    ...paginationFields,
  ],
};

export const outlookListChildMailFoldersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'parentFolderId', label: 'Parent Folder ID' },
    { key: 'folders', label: 'Folders', labelKey: 'displayName', listItems: mailFolderFields },
    ...paginationFields,
  ],
};

export const outlookListMailFoldersDeltaActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'changes',
      label: 'Changed Folders',
      labelKey: 'displayName',
      listItems: [...fullMailFolderFields, ...deltaRemovalFields],
    },
    ...paginationFields,
    { key: 'deltaLink', label: 'Delta Link', format: 'url' },
  ],
};

export const outlookCreateMailFolderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
    { key: 'folder', label: 'Folder', children: fullMailFolderFields },
  ],
};

export const outlookCopyMailFolderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'newFolderId', label: 'New Folder ID' },
    { key: 'sourceFolderId', label: 'Source Folder ID' },
    { key: 'destinationFolderId', label: 'Destination Folder ID' },
    { key: 'folder', label: 'Folder', children: fullMailFolderFields },
  ],
};

export const outlookMoveMailFolderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
    { key: 'newFolderId', label: 'New Folder ID' },
    { key: 'destinationFolderId', label: 'Destination Folder ID' },
    { key: 'folder', label: 'Folder', children: fullMailFolderFields },
  ],
};

export const outlookDeleteMailFolderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Result Message' },
    { key: 'folderId', label: 'Folder ID' },
  ],
};

export const outlookFocusedInboxOverrideActionOutputSchema: OutputSchema = {
  fields: focusedInboxOverrideFields,
};

export const outlookListFocusedInboxOverridesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'overrides',
      label: 'Overrides',
      labelKey: 'classifyAs',
      listItems: focusedInboxOverrideFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const outlookDeleteFocusedInboxOverrideActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Result Message' },
    { key: 'overrideId', label: 'Override ID' },
  ],
};

export const outlookGetMailTipsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'mailTips',
      label: 'Mail Tips',
      listItems: [
        { key: 'emailAddress', label: 'Email Address', children: plainEmailAddressFields },
        { key: 'mailboxFull', label: 'Mailbox Full', format: 'boolean' },
        { key: 'deliveryRestricted', label: 'Delivery Restricted', format: 'boolean' },
        { key: 'isModerated', label: 'Is Moderated', format: 'boolean' },
        { key: 'recipientScope', label: 'Recipient Scope' },
        { key: 'maxMessageSize', label: 'Max Message Size', format: 'filesize' },
        { key: 'externalMemberCount', label: 'External Member Count', format: 'number' },
        { key: 'totalMemberCount', label: 'Total Member Count', format: 'number' },
        { key: 'automaticReplies', label: 'Automatic Replies' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const outlookGetMyProfileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'mail', label: 'Email Address', format: 'email' },
    { key: 'userPrincipalName', label: 'User Principal Name' },
    { key: 'source', label: 'Source' },
  ],
};

export const outlookGetSupportedTimeZonesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timeZones',
      label: 'Time Zones',
      labelKey: 'displayName',
      listItems: [
        { key: 'alias', label: 'Alias' },
        { key: 'displayName', label: 'Display Name' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const outlookSendEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Result Message' },
    { key: 'subject', label: 'Subject' },
    { key: 'recipients', label: 'Recipients' },
  ],
};

export const outlookSendDraftActionOutputSchema: OutputSchema = { fields: dispatchResultFields };

export const outlookReplyToMessageActionOutputSchema: OutputSchema = {
  fields: dispatchResultFields,
};

export const outlookReplyAllToMessageActionOutputSchema: OutputSchema = {
  fields: dispatchResultFields,
};

export const outlookForwardMessageActionOutputSchema: OutputSchema = {
  fields: [...dispatchResultFields, { key: 'recipients', label: 'Recipients' }],
};
