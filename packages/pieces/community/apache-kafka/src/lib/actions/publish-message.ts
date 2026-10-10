import { createAction, Property } from '@activepieces/pieces-framework'
import { kafkaAuth } from '../auth'
import { kafkaClient } from '../common/client'

export const publishMessage = createAction({
  auth: kafkaAuth,
  name: 'publish_message',
  displayName: 'Publish message',
  description: 'Publishes one message to a Kafka topic and returns its partition and offset.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Publish one message to an Apache Kafka topic. Use this for a single record; use Publish messages when several records should go out in the same step. The call waits for all in-sync replicas and returns the partition and offset. A retry publishes another message.',
    idempotent: false,
  },
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'Topic to publish to, for example orders.',
      required: true,
    }),
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
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Optional text headers, for example source = checkout.',
      required: false,
    }),
    partition: Property.Number({
      displayName: 'Partition',
      description: 'Optional partition number, starting at 0. Leave empty to let Kafka choose from the key.',
      required: false,
    }),
  },
  async run(context) {
    const [result] = await kafkaClient.publishMessages({
      auth: context.auth.props,
      topic: context.propsValue.topic,
      messages: [{
        key: context.propsValue.key,
        value: context.propsValue.value,
        headers: context.propsValue.headers,
        partition: context.propsValue.partition,
      }],
    })
    if (result === undefined) {
      throw new Error('Kafka did not return an offset for the published message.')
    }
    return result
  },
})
