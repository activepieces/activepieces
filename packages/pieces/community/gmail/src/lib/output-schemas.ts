import { OutputSchema } from '@activepieces/pieces-framework';

export const sendEmailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'messageId',
      label: 'Message ID',
      value: 'data.id',
    },
    {
      key: 'threadId',
      label: 'Thread ID',
      value: 'data.threadId',
    },
    {
      key: 'labelIds',
      label: 'Labels',
      value: 'data.labelIds',
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
    {
      key: 'statusText',
      label: 'Status Text',
      value: 'statusText',
    },
  ],
};

export const createDraftReplyActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Draft ID',
      value: 'id',
    },
    {
      key: 'subject',
      label: 'Subject',
      value: 'draftDetails.subject',
    },
    {
      key: 'replyType',
      label: 'Reply Type',
      value: 'draftDetails.replyType',
    },
    {
      key: 'includeOriginal',
      label: 'Include Original',
      value: 'draftDetails.includeOriginal',
      format: 'boolean',
    },
    {
      key: 'recipientsTo',
      label: 'To',
      value: 'draftDetails.recipients.to',
    },
    {
      key: 'recipientsCc',
      label: 'Cc',
      value: 'draftDetails.recipients.cc',
    },
    {
      key: 'message',
      label: 'Draft Message',
      children: [
        {
          key: 'id',
          label: 'Message ID',
          value: 'id',
        },
        {
          key: 'threadId',
          label: 'Thread ID',
          value: 'threadId',
        },
        {
          key: 'labelIds',
          label: 'Label IDs',
          value: 'labelIds',
        },
      ],
    },
    {
      key: 'originalMessage',
      label: 'Original Message',
      children: [
        {
          key: 'subject',
          label: 'Subject',
          value: 'subject',
        },
        {
          key: 'from',
          label: 'From',
          value: 'from',
          format: 'email',
        },
        {
          key: 'to',
          label: 'To',
          value: 'to',
          format: 'email',
        },
        {
          key: 'date',
          label: 'Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'id',
          label: 'Message ID',
          value: 'id',
        },
        {
          key: 'threadId',
          label: 'Thread ID',
          value: 'threadId',
        },
      ],
    },
  ],
};

export const replyToEmailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Message ID',
    },
    {
      key: 'threadId',
      label: 'Thread ID',
    },
    {
      key: 'labelIds',
      label: 'Labels',
      listItems: [
        {
          key: 'label',
          label: 'Label',
          value: '',
        },
      ],
    },
  ],
};

export const gmailSearchMailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      value: 'found',
      format: 'boolean',
    },
    {
      key: 'count',
      label: 'Count',
      value: 'results.count',
      format: 'number',
    },
    {
      key: 'messages',
      label: 'Messages',
      value: 'results.messages',
      labelKey: 'subject',
      listItems: [
        {
          key: 'subject',
          label: 'Subject',
          value: 'subject',
        },
        {
          key: 'fromName',
          label: 'From Name',
          value: 'from.value[0].name',
        },
        {
          key: 'fromAddress',
          label: 'From Address',
          value: 'from.value[0].address',
          format: 'email',
        },
        {
          key: 'toAddress',
          label: 'To Address',
          value: 'to.value[0].address',
          format: 'email',
        },
        {
          key: 'date',
          label: 'Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'text',
          label: 'Text Body',
          value: 'text',
        },
        {
          key: 'id',
          label: 'Message ID',
          value: 'id',
        },
        {
          key: 'messageId',
          label: 'RFC Message-ID',
          value: 'messageId',
        },
        {
          key: 'replyToAddress',
          label: 'Reply-To Address',
          value: 'replyTo.value[0].address',
          format: 'email',
        },
        {
          key: 'attachments',
          label: 'Attachments',
          value: 'attachments',
          labelKey: 'fileName',
          listItems: [
            {
              key: 'fileName',
              label: 'File Name',
              value: 'fileName',
            },
            {
              key: 'mimeType',
              label: 'MIME Type',
              value: 'mimeType',
            },
            {
              key: 'size',
              label: 'Size',
              value: 'size',
              format: 'filesize',
            },
            {
              key: 'data',
              label: 'Download URL',
              value: 'data',
              format: 'url',
            },
          ],
        },
      ],
    },
  ],
};

export const requestApprovalInMailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'approved',
      label: 'Approved',
      value: 'approved',
      format: 'boolean',
    },
  ],
};

export const gmailGetMailActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subject',
      label: 'Subject',
    },
    {
      key: 'from',
      label: 'From',
      value: 'from.text',
    },
    {
      key: 'to',
      label: 'To',
      value: 'to.text',
    },
    {
      key: 'date',
      label: 'Date',
      format: 'datetime',
    },
    {
      key: 'text',
      label: 'Text Body',
    },
    {
      key: 'html',
      label: 'HTML Body',
      format: 'html',
    },
    {
      key: 'id',
      label: 'Email ID',
    },
    {
      key: 'messageId',
      label: 'Message ID',
    },
    {
      key: 'fromValue',
      label: 'From Addresses',
      value: 'from.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
        },
      ],
    },
    {
      key: 'toValue',
      label: 'To Addresses',
      value: 'to.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
        },
      ],
    },
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'filename',
      listItems: [
        {
          key: 'filename',
          label: 'Filename',
        },
        {
          key: 'contentType',
          label: 'Content Type',
        },
        {
          key: 'size',
          label: 'Size',
          format: 'filesize',
        },
      ],
    },
  ],
};

export const newAttachmentTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'attachment',
      label: 'Attachment',
      children: [
        {
          key: 'fileName',
          label: 'File Name',
          value: 'fileName',
        },
        {
          key: 'mimeType',
          label: 'MIME Type',
          value: 'mimeType',
        },
        {
          key: 'size',
          label: 'Size',
          value: 'size',
          format: 'filesize',
        },
        {
          key: 'data',
          label: 'File',
          value: 'data',
          format: 'url',
        },
      ],
    },
    {
      key: 'subject',
      label: 'Subject',
      value: 'message.subject',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'message.date',
      format: 'datetime',
    },
    {
      key: 'from',
      label: 'From',
      value: 'message.from.text',
    },
    {
      key: 'to',
      label: 'To',
      value: 'message.to.text',
    },
    {
      key: 'messageId',
      label: 'Message ID',
      value: 'message.messageId',
    },
    {
      key: 'id',
      label: 'Gmail Message ID',
      value: 'message.id',
    },
    {
      key: 'fromDetails',
      label: 'From Details',
      value: 'message.from.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Address',
          value: 'address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
      ],
    },
    {
      key: 'toDetails',
      label: 'To Details',
      value: 'message.to.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Address',
          value: 'address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
      ],
    },
    {
      key: 'html',
      label: 'HTML Body',
      value: 'message.html',
      format: 'html',
    },
  ],
};

export const newLabelTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Label Name',
    },
    {
      key: 'id',
      label: 'Label ID',
    },
    {
      key: 'type',
      label: 'Type',
    },
    {
      key: 'messageListVisibility',
      label: 'Message List Visibility',
    },
    {
      key: 'labelListVisibility',
      label: 'Label List Visibility',
    },
  ],
};

export const gmailNewEmailReceivedTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subject',
      label: 'Subject',
      value: 'message.subject',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'message.date',
      format: 'datetime',
    },
    {
      key: 'fromAddress',
      label: 'From',
      value: 'message.from.text',
    },
    {
      key: 'toAddress',
      label: 'To',
      value: 'message.to.text',
    },
    {
      key: 'text',
      label: 'Body (Text)',
      value: 'message.text',
    },
    {
      key: 'html',
      label: 'Body (HTML)',
      value: 'message.html',
      format: 'html',
    },
    {
      key: 'messageId',
      label: 'Message ID',
      value: 'message.messageId',
    },
    {
      key: 'from',
      label: 'From Addresses',
      value: 'message.from.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Email',
          value: 'address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
      ],
    },
    {
      key: 'to',
      label: 'To Addresses',
      value: 'message.to.value',
      labelKey: 'name',
      listItems: [
        {
          key: 'address',
          label: 'Email',
          value: 'address',
          format: 'email',
        },
        {
          key: 'name',
          label: 'Name',
          value: 'name',
        },
      ],
    },
    {
      key: 'attachments',
      label: 'Attachments',
      value: 'message.attachments',
    },
    {
      key: 'threadId',
      label: 'Thread ID',
      value: 'thread.data.id',
    },
    {
      key: 'messages',
      label: 'Thread Messages',
      value: 'thread.data.messages',
      labelKey: 'snippet',
      listItems: [
        {
          key: 'id',
          label: 'Message ID',
          value: 'id',
        },
        {
          key: 'threadId',
          label: 'Thread ID',
          value: 'threadId',
        },
        {
          key: 'snippet',
          label: 'Snippet',
          value: 'snippet',
        },
        {
          key: 'labelIds',
          label: 'Labels',
          value: 'labelIds',
        },
        {
          key: 'sizeEstimate',
          label: 'Size Estimate',
          value: 'sizeEstimate',
          format: 'filesize',
        },
      ],
    },
  ],
};

export const newLabeledEmailTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subject',
      label: 'Subject',
      value: 'data.message.subject',
    },
    {
      key: 'from',
      label: 'From',
      value: 'data.message.from.text',
      format: 'email',
    },
    {
      key: 'to',
      label: 'To',
      value: 'data.message.to.text',
      format: 'email',
    },
    {
      key: 'text',
      label: 'Body (Text)',
      value: 'data.message.text',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'data.message.date',
      format: 'datetime',
    },
    {
      key: 'id',
      label: 'Message ID',
      value: 'id',
    },
    {
      key: 'messageId',
      label: 'Internet Message ID',
      value: 'data.message.messageId',
    },
    {
      key: 'addedAt',
      label: 'Label Added At',
      value: 'data.labelInfo.addedAt',
      format: 'datetime',
    },
    {
      key: 'attachments',
      label: 'Attachments',
      value: 'data.message.attachments',
      labelKey: 'filename',
      listItems: [
        {
          key: 'filename',
          label: 'Filename',
          value: 'filename',
        },
        {
          key: 'contentType',
          label: 'Content Type',
          value: 'contentType',
        },
        {
          key: 'size',
          label: 'Size',
          value: 'size',
          format: 'filesize',
        },
      ],
    },
    {
      key: 'thread',
      label: 'Thread',
      value: 'data.thread',
      children: [
        {
          key: 'id',
          label: 'Thread ID',
          value: 'id',
        },
        {
          key: 'messages',
          label: 'Messages',
          value: 'messages',
          labelKey: 'snippet',
          listItems: [
            {
              key: 'snippet',
              label: 'Snippet',
              value: 'snippet',
            },
            {
              key: 'id',
              label: 'Message ID',
              value: 'id',
            },
            {
              key: 'threadId',
              label: 'Thread ID',
              value: 'threadId',
            },
            {
              key: 'labelIds',
              label: 'Label IDs',
              value: 'labelIds',
            },
            {
              key: 'internalDate',
              label: 'Internal Date',
              value: 'internalDate',
            },
            {
              key: 'sizeEstimate',
              label: 'Size Estimate',
              value: 'sizeEstimate',
              format: 'filesize',
            },
          ],
        },
      ],
    },
  ],
};
