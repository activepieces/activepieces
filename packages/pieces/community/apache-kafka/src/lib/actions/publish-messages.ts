import { createAction, Property } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaClient } from '../common/client'

export const publishMessages = createAction({
  auth: kafkaAuth,
  name: 'publish_messages',
  displayName: 'Publish messages',
  description: 'Publishes several messages to a Kafka topic in one step and returns a partition and offset for each.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Publish multiple messages to one Apache Kafka topic in a single step and return each message partition and offset. Use Publish message when there is only one record. Messages are sent in order on one connection, waiting for all in-sync replicas. A retry publishes the batch again.',
    idempotent: false,
  },
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'Topic to publish to, for example orders.',
      required: true,
    }),
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Messages published in order. Each result includes that message key, partition, and offset.',
      required: true,
      properties: {
        key: Property.ShortText({
          displayName: 'Key',
          description: 'Optional message key. Messages with the same key stay in order on one partition.',
          required: false,
        }),
        value: Property.LongText({
          displayName: 'Value',
          description: 'Message body sent as UTF-8 text. For JSON, paste the JSON document.',
          required: true,
        }),
        partition: Property.Number({
          displayName: 'Partition',
          description: 'Optional partition number, starting at 0. Leave empty to let Kafka choose from the key.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    return kafkaClient.publishMessages({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      messages: context.propsValue.messages,
    })
  },
})
