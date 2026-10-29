import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework'

const publishResultFields: OutputSchemaField[] = [
  { key: 'topic', label: 'Topic' },
  { key: 'key', label: 'Key' },
  { key: 'partition', label: 'Partition', format: 'number' },
  { key: 'offset', label: 'Offset' },
]

const messageFields: OutputSchemaField[] = [
  { key: 'topic', label: 'Topic' },
  { key: 'partition', label: 'Partition', format: 'number' },
  { key: 'offset', label: 'Offset' },
  { key: 'key', label: 'Key' },
  { key: 'payload', label: 'Payload' },
  { key: 'headers', label: 'Headers', dynamicKey: true },
  { key: 'timestamp', label: 'Timestamp (Unix ms)' },
]

const publishMessageOutputSchema: OutputSchema = {
  fields: publishResultFields,
}

const publishMessagesOutputSchema: OutputSchema = {
  itemLabel: 'Message {offset}',
  fields: [
    {
      key: 'messages',
      label: 'Published Messages',
      value: '',
      labelKey: 'offset',
      listItems: publishResultFields,
    },
  ],
}

const newMessageOutputSchema: OutputSchema = {
  fields: messageFields,
}

const newMessagesBatchOutputSchema: OutputSchema = {
  fields: [
    { key: 'topic', label: 'Topic' },
    { key: 'message_count', label: 'Message Count', format: 'number' },
    {
      key: 'messages',
      label: 'Messages',
      labelKey: 'offset',
      listItems: messageFields,
    },
  ],
}

export const kafkaOutputSchemas = {
  publishMessage: publishMessageOutputSchema,
  publishMessages: publishMessagesOutputSchema,
  newMessage: newMessageOutputSchema,
  newMessagesBatch: newMessagesBatchOutputSchema,
}
