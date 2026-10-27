import { createPiece } from '@activepieces/pieces-framework';
import { messageReceived } from './lib/triggers/message-received';
import { sendMessageToExchange } from './lib/actions/send-message-to-exchange';
import { sendMessageToQueue } from './lib/actions/send-message-to-queue';
import { publishToQueue } from './lib/actions/ai/publish-to-queue';
import { publishToExchange } from './lib/actions/ai/publish-to-exchange';
import { getQueueInfo } from './lib/actions/ai/get-queue-info';
import { listQueues } from './lib/actions/ai/list-queues';
import { listExchanges } from './lib/actions/ai/list-exchanges';
import { listBindings } from './lib/actions/ai/list-bindings';
import { rabbitmqAuth } from './lib/auth';

export const rabbitmq = createPiece({
  displayName: 'RabbitMQ',
  auth: rabbitmqAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/rabbitmq.png',
  authors: ['alinperghel'],
  actions: [
    sendMessageToExchange,
    sendMessageToQueue,
    publishToQueue,
    publishToExchange,
    getQueueInfo,
    listQueues,
    listExchanges,
    listBindings,
  ],
  triggers: [messageReceived],
});
