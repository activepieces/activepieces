import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { kafkaAuth } from './lib/auth';
import { newMessage } from './lib/triggers/new-message';

export const kafka = createPiece({
  displayName: 'Apache Kafka',
  description:
    'Consume messages from Kafka-compatible clusters, including self-managed Apache Kafka, Azure Event Hubs, and Confluent Cloud.',
  auth: kafkaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kafka.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ['onyedikachi-david'],
  actions: [],
  triggers: [newMessage],
});
