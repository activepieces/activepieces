import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaClient } from '../common/client'
import { kafkaConfig } from '../common/config'
import { kafkaRecords } from '../common/records'
import { kafkaTriggerProps } from './props'

async function readBatch({ auth, topic, consumerGroup, maxMessages, pollTimeoutSeconds, startFrom, commit }: {
  auth: Parameters<typeof kafkaClient.consume>[0]['auth']
  topic: string
  consumerGroup: string
  maxMessages: number
  pollTimeoutSeconds: number
  startFrom: string
  commit: boolean
}) {
  const records = await kafkaClient.consume({
    auth,
    topic,
    consumerGroup,
    maxMessages,
    pollTimeoutSeconds,
    fromBeginning: kafkaConfig.readStartFrom(startFrom),
    commit,
  })
  return kafkaRecords.toTriggerOutput({ records, topic: kafkaConfig.readTopic(topic), batch: true })
}

export const newMessagesBatch = createTrigger({
  auth: kafkaAuth,
  name: 'new_messages_batch',
  displayName: 'New messages in topic',
  description: 'Reads a batch of new messages on a topic in one run.',
  aiMetadata: {
    description: 'Read a batch of new Apache Kafka messages from a topic in one flow run. Choose the single-message trigger when each message should start its own run. Offsets are committed to the consumer group after a successful read. The flow polling schedule decides how often the topic is checked.',
  },
  classification: 'READ',
  props: kafkaTriggerProps.fields({ batch: true }),
  sampleData: {
    topic: 'orders',
    message_count: 1,
    messages: [{
      topic: 'orders',
      partition: 0,
      offset: '42',
      key: 'order-1',
      payload: '{"id":"order-1"}',
      headers: { source: 'checkout' },
      timestamp: '1710000000000',
    }],
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return readBatch({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      consumerGroup: context.propsValue.consumerGroup,
      maxMessages: context.propsValue.maxMessages,
      pollTimeoutSeconds: context.propsValue.pollTimeoutSeconds,
      startFrom: context.propsValue.startFrom,
      commit: false,
    })
  },
  async onEnable(context) {
    await kafkaClient.pinStartOffsets({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      consumerGroup: context.propsValue.consumerGroup,
      fromBeginning: kafkaConfig.readStartFrom(context.propsValue.startFrom),
    })
  },
  async onDisable() {
    return
  },
  async run(context) {
    return readBatch({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      consumerGroup: context.propsValue.consumerGroup,
      maxMessages: context.propsValue.maxMessages,
      pollTimeoutSeconds: context.propsValue.pollTimeoutSeconds,
      startFrom: context.propsValue.startFrom,
      commit: true,
    })
  },
})
