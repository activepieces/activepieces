import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaOutputSchemas } from '../output-schemas'
import { kafkaTriggerProps } from './props'
import { kafkaTriggerRead } from './read'

export const newMessage = createTrigger({
  auth: kafkaAuth,
  name: 'new_message',
  displayName: 'New message in topic',
  description: 'Reads each new message on a topic, including its payload, key, partition, and offset. Messages are marked as read before the flow runs, so if a run fails, that message is not delivered again.',
  aiMetadata: {
    description: 'Read new Apache Kafka messages from a topic, one flow run per message. Choose the batch trigger when one run should receive the whole group of messages. Offsets are committed to the consumer group before the flow runs, so a message from a failed run is not delivered again, and a shared group splits messages across flows. The flow polling schedule decides how often the topic is checked.',
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
  outputSchema: kafkaOutputSchemas.newMessage,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return kafkaTriggerRead.sample({ auth: context.auth.props, props: context.propsValue, batch: false })
  },
  async onEnable(context) {
    await kafkaTriggerRead.enable({ auth: context.auth.props, props: context.propsValue })
  },
  async onDisable() {
    return
  },
  async run(context) {
    return kafkaTriggerRead.poll({ auth: context.auth.props, props: context.propsValue, batch: false })
  },
})
