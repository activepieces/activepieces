import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export const sendMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'messageId', label: 'Message ID' },
    { key: 'sequenceNumber', label: 'Sequence Number' },
    { key: 'md5OfMessageBody', label: 'MD5 of Message Body' },
  ],
};

export const sendMessageBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'successful',
      label: 'Successful',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Entry ID' },
        { key: 'messageId', label: 'Message ID' },
        { key: 'sequenceNumber', label: 'Sequence Number' },
        { key: 'md5OfMessageBody', label: 'MD5 of Message Body' },
      ],
    },
    {
      key: 'failed',
      label: 'Failed',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Entry ID' },
        { key: 'code', label: 'Error Code' },
        { key: 'message', label: 'Error Message' },
        { key: 'senderFault', label: 'Sender Fault', format: 'boolean' },
      ],
    },
    { key: 'successCount', label: 'Success Count', format: 'number' },
    { key: 'failureCount', label: 'Failure Count', format: 'number' },
  ],
};

export const receiveMessagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'messages', label: 'Messages', labelKey: 'messageId', listItems: messageFields() },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const deleteMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
  ],
};

export const changeVisibilityOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'visibilityTimeout', label: 'Visibility Timeout (seconds)', format: 'number' },
  ],
};

export const listQueuesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'queues',
      label: 'Queues',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'url', label: 'URL', format: 'url' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
  ],
};

export const getQueueAttributesOutputSchema: OutputSchema = {
  fields: [
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
    { key: 'queueArn', label: 'Queue ARN' },
    { key: 'approximateNumberOfMessages', label: 'Messages Visible', format: 'number' },
    { key: 'approximateNumberOfMessagesNotVisible', label: 'Messages In Flight', format: 'number' },
    { key: 'approximateNumberOfMessagesDelayed', label: 'Messages Delayed', format: 'number' },
    { key: 'fifoQueue', label: 'FIFO Queue', format: 'boolean' },
    { key: 'contentBasedDeduplication', label: 'Content-Based Deduplication', format: 'boolean' },
    { key: 'visibilityTimeout', label: 'Visibility Timeout (seconds)', format: 'number' },
    { key: 'messageRetentionPeriod', label: 'Retention Period (seconds)', format: 'number' },
    { key: 'maximumMessageSize', label: 'Maximum Message Size (bytes)', format: 'number' },
    { key: 'delaySeconds', label: 'Delay (seconds)', format: 'number' },
    { key: 'receiveMessageWaitTimeSeconds', label: 'Receive Wait Time (seconds)', format: 'number' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedAt', label: 'Last Modified At', format: 'datetime' },
    { key: 'redrivePolicy', label: 'Redrive Policy' },
  ],
};

export const purgeQueueOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
  ],
};

export const newMessageOutputSchema: OutputSchema = {
  fields: messageFields(),
};

export const getQueueUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'queueName', label: 'Queue Name' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
  ],
};

export const createQueueOutputSchema: OutputSchema = {
  fields: [
    { key: 'queueName', label: 'Queue Name' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
    { key: 'fifo', label: 'FIFO Queue', format: 'boolean' },
  ],
};

export const deleteQueueOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
  ],
};

export const setQueueAttributesOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
    { key: 'updatedAttributes', label: 'Updated Attributes' },
  ],
};

export const batchResultOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'successful',
      label: 'Successful',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Entry ID' }],
    },
    {
      key: 'failed',
      label: 'Failed',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Entry ID' },
        { key: 'code', label: 'Error Code' },
        { key: 'message', label: 'Error Message' },
        { key: 'senderFault', label: 'Sender Fault', format: 'boolean' },
      ],
    },
    { key: 'successCount', label: 'Success Count', format: 'number' },
    { key: 'failureCount', label: 'Failure Count', format: 'number' },
  ],
};

export const tagQueueOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
    { key: 'tagKeys', label: 'Tag Keys' },
  ],
};

export const listQueueTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'queueUrl', label: 'Queue URL', format: 'url' },
    { key: 'tags', label: 'Tags', dynamicKey: true },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

function messageFields(): OutputSchemaField[] {
  return [
    { key: 'messageId', label: 'Message ID' },
    { key: 'receiptHandle', label: 'Receipt Handle' },
    { key: 'body', label: 'Body' },
    { key: 'md5OfBody', label: 'MD5 of Body' },
    { key: 'sentAt', label: 'Sent At', format: 'datetime' },
    { key: 'approximateReceiveCount', label: 'Approximate Receive Count', format: 'number' },
    { key: 'approximateFirstReceiveAt', label: 'First Received At', format: 'datetime' },
    { key: 'senderId', label: 'Sender ID' },
    { key: 'messageGroupId', label: 'Message Group ID' },
    { key: 'messageDeduplicationId', label: 'Message Deduplication ID' },
    { key: 'sequenceNumber', label: 'Sequence Number' },
    { key: 'messageAttributes', label: 'Message Attributes', dynamicKey: true },
  ];
}
