import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaOutputSchemas } from '../output-schemas'
import { kafkaTriggerProps } from './props'
import { kafkaTriggerRead } from './read'

export const newMessagesBatch = createTrigger({
  auth: kafkaAuth,
  name: 'new_messages_batch',
  displayName: 'New messages in topic',
  description: 'Reads a batch of new messages on a topic in one run. Messages are marked as read before the flow runs, so if a run fails, those messages are not delivered again.',
  aiMetadata: {
    description: 'Read a batch of new Apache Kafka messages from a topic in one flow run. Choose the single-message trigger when each message should start its own run. Offsets are committed to the consumer group before the flow runs, so messages from a failed run are not delivered again. The flow polling schedule decides how often the topic is checked.',
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
  outputSchema: kafkaOutputSchemas.newMessagesBatch,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return kafkaTriggerRead.sample({ auth: context.auth.props, props: context.propsValue, batch: true })
  },
  async onEnable(context) {
    await kafkaTriggerRead.enable({ auth: context.auth.props, props: context.propsValue })
  },
  async onDisable() {
    return
  },
  async run(context) {
    return kafkaTriggerRead.poll({ auth: context.auth.props, props: context.propsValue, batch: true })
  },
})
