import { Property } from '@activepieces/pieces-framework'

export const kafkaTriggerProps = {
  fields({ batch }: { batch: boolean }) {
    return {
      topic: Property.ShortText({
        displayName: 'Topic',
        description: 'Topic to read, for example orders.',
        required: true,
      }),
      consumerGroup: Property.ShortText({
        displayName: 'Consumer group',
        description: 'Kafka consumer group id, for example activepieces-orders. Use a different group for each flow that should receive every message. Flows that share a group split the topic between them.',
        required: true,
      }),
      maxMessages: Property.Number({
        displayName: 'Max messages',
        description: batch
          ? 'Maximum messages included in one batch. Whole number from 1 to 500.'
          : 'Maximum messages to read each time the flow checks the topic. Each message starts its own run. Whole number from 1 to 500.',
        required: true,
        defaultValue: batch ? 100 : 50,
      }),
      pollTimeoutSeconds: Property.Number({
        displayName: 'Poll timeout (seconds)',
        description: 'How long to wait for messages on each check. Whole number from 1 to 20. The flow schedule controls how often checks run.',
        required: true,
        defaultValue: 10,
      }),
      startFrom: Property.StaticDropdown({
        displayName: 'Start from',
        description: 'Used only when this consumer group has no committed offset yet. New messages only skips history. Beginning of the topic reads what is still retained.',
        required: true,
        defaultValue: 'latest',
        options: {
          options: [
            { label: 'New messages only', value: 'latest' },
            { label: 'Beginning of the topic', value: 'beginning' },
          ],
        },
      }),
    }
  },
}
