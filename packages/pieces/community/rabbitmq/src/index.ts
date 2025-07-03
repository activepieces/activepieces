import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { messageReceived } from './lib/triggers/message-received';
import { sendMessageToExchange } from './lib/actions/send-message-to-exchange';
import { sendMessageToQueue } from './lib/actions/send-message-to-queue';

export const rabbitmqAuth = PieceAuth.CustomAuth({
  description: "Rabbitmq Auth",
  required: true,
  props: {
    host: Property.ShortText({
      displayName: "Host",
      description: "Host",
      required: true,
    }),
    username: Property.ShortText({
      displayName: "Username",
      description: "Username",
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: "Password",
      description: "Password",
      required: true,
    }),
    port: Property.Number({
      displayName: "Port",
      description: "Port",
      required: true,
    }),
    vhost: Property.ShortText({
      displayName: "Virtual Host",
      description: "Virtual Host",
      required: false,
    }),
  },
});

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
