import { createPiece, PieceCategory } from '@activepieces/pieces-framework'
import { publishMessage } from './lib/actions/publish-message'
import { publishMessages } from './lib/actions/publish-messages'
import { kafkaAuth } from './lib/auth'
import { newMessage } from './lib/triggers/new-message'
import { newMessagesBatch } from './lib/triggers/new-messages-batch'

export const apacheKafka = createPiece({
  displayName: 'Apache Kafka',
  description: 'Publish and consume messages on an Apache Kafka cluster.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/apache-kafka.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: kafkaAuth,
  authors: ['eliseukadesh67'],
  actions: [publishMessage, publishMessages],
  triggers: [newMessage, newMessagesBatch],
})
