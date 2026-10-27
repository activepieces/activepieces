import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { rabbitmqCommon } from './common';

export const rabbitmqAuth = PieceAuth.CustomAuth({
  description: 'Connect to your RabbitMQ broker over AMQP. Add the Management API URL to let AI agents list queues, exchanges and bindings.',
  required: true,
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'Broker host name or IP, without scheme or port (for example rabbitmq.example.com).',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Password',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'AMQP port. Usually 5672, or 5671 with TLS.',
      required: true,
      defaultValue: 5672,
    }),
    vhost: Property.ShortText({
      displayName: 'Virtual Host',
      description: 'Virtual host name. Leave empty for the default "/".',
      required: false,
    }),
    useTls: Property.Checkbox({
      displayName: 'Use TLS (amqps)',
      description: 'Connect with TLS. Most hosted brokers require this.',
      required: false,
      defaultValue: false,
    }),
    managementUrl: Property.ShortText({
      displayName: 'Management API URL',
      description: 'Optional. Base URL of the RabbitMQ Management plugin (for example http://localhost:15672). Uses the same username and password.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const connection = await rabbitmqCommon.connect(auth);
      connection.on('error', () => undefined);
      await connection.close().catch(() => undefined);
    } catch (e) {
      return {
        valid: false,
        error: `Could not connect to the broker: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
    if (auth.managementUrl) {
      try {
        await rabbitmqCommon.managementRequest({ auth, path: '/overview' });
      } catch {
        return {
          valid: false,
          error: 'Connected over AMQP, but the Management API URL did not accept these credentials. Check the URL and that the user has the "management" tag.',
        };
      }
    }
    return { valid: true };
  },
});
