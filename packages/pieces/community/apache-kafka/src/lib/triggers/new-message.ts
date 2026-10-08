import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaClient } from '../common/client'
import { kafkaConfig } from '../common/config'
import { kafkaRecords } from '../common/records'
import { kafkaTriggerProps } from './props'

async function readMessages({ auth, topic, consumerGroup, maxMessages, pollTimeoutSeconds, startFrom, commit, batch }: {
  auth: Parameters<typeof kafkaClient.consume>[0]['auth']
  topic: string
  consumerGroup: string
  maxMessages: number
  pollTimeoutSeconds: number
  startFrom: string
  commit: boolean
  batch: boolean
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
  return kafkaRecords.toTriggerOutput({ records, topic: kafkaConfig.readTopic(topic), batch })
}

export const newMessage = createTrigger({
  auth: kafkaAuth,
  name: 'new_message',
  displayName: 'New message in topic',
  description: 'Reads each new message on a topic, including its payload, key, partition, and offset.',
  aiMetadata: {
    description: 'Read new Apache Kafka messages from a topic, one flow run per message. Choose the batch trigger when one run should receive the whole group of messages. Offsets are committed to the consumer group, so a shared group splits messages across flows. The flow polling schedule decides how often the topic is checked.',
  },
  classification: 'READ',
  props: kafkaTriggerProps.fields({ batch: false }),
  sampleData: {
    topic: 'orders',
    partition: 0,
    offset: '42',
    key: 'order-1',
    payload: '{"id":"order-1"}',
    headers: { source: 'checkout' },
    timestamp: '1710000000000',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return readMessages({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      consumerGroup: context.propsValue.consumerGroup,
      maxMessages: context.propsValue.maxMessages,
      pollTimeoutSeconds: context.propsValue.pollTimeoutSeconds,
      startFrom: context.propsValue.startFrom,
      commit: false,
      batch: false,
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
    return readMessages({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      consumerGroup: context.propsValue.consumerGroup,
      maxMessages: context.propsValue.maxMessages,
      pollTimeoutSeconds: context.propsValue.pollTimeoutSeconds,
      startFrom: context.propsValue.startFrom,
      commit: true,
      batch: false,
    })
  },
})
