import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { messageReceived } from './lib/triggers/message-received';
import { sendMessageToExchange } from './lib/actions/send-message-to-exchange';
import { sendMessageToQueue } from './lib/actions/send-message-to-queue';
import { rabbitmqAuth } from './lib/auth';

export const rabbitmq = createPiece({
  displayName: "RabbitMQ",
  auth: rabbitmqAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/rabbitmq.png",
  authors: [
    "alinperghel"
  ],
  actions: [
    sendMessageToExchange,
    sendMessageToQueue,
  ],
  triggers: [
    messageReceived,
  ],
});
