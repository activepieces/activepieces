import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { KafkaAuthMethod, kafkaCommon } from './common';

export const kafkaAuth = PieceAuth.CustomAuth({
  description: `Connect to any Kafka-compatible cluster: self-managed Apache Kafka, Azure Event Hubs, Confluent Cloud, Redpanda, and others.

**Azure Event Hubs** (Kafka endpoint, Standard tier or above):
1. Bootstrap Servers: \`<namespace>.servicebus.windows.net:9093\`
2. Authentication Method: **SASL/PLAIN**, keep **Use TLS** enabled
3. Username: \`$ConnectionString\`
4. Password: the namespace connection string (Event Hubs Namespace → Shared access policies → copy **Connection string–primary key**)

**Confluent Cloud**:
1. Bootstrap Servers: from Cluster settings, e.g. \`pkc-xxxxx.<region>.<provider>.confluent.cloud:9092\`
2. Authentication Method: **SASL/PLAIN**, keep **Use TLS** enabled
3. Username: your cluster API key — Password: the API secret

**Mutual TLS**: paste your PEM-encoded client certificate and private key, plus the CA certificate if the cluster uses a private CA.`,
  required: true,
  props: {
    bootstrapServers: Property.ShortText({
      displayName: 'Bootstrap Servers',
      description: 'Comma-separated list of broker addresses in host:port format, e.g. broker1.example.com:9092,broker2.example.com:9092.',
      required: true,
    }),
    authMethod: Property.StaticDropdown<KafkaAuthMethod, true>({
      displayName: 'Authentication Method',
      description: 'How Activepieces authenticates to the cluster.',
      required: true,
      defaultValue: KafkaAuthMethod.SASL_PLAIN,
      options: {
        options: [
          { label: 'SASL/PLAIN (Azure Event Hubs, Confluent Cloud)', value: KafkaAuthMethod.SASL_PLAIN },
          { label: 'SASL/SCRAM-SHA-256', value: KafkaAuthMethod.SASL_SCRAM_256 },
          { label: 'SASL/SCRAM-SHA-512', value: KafkaAuthMethod.SASL_SCRAM_512 },
          { label: 'Mutual TLS (client certificate)', value: KafkaAuthMethod.MTLS },
          { label: 'None (unauthenticated)', value: KafkaAuthMethod.NONE },
        ],
      },
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'SASL username. Azure Event Hubs: $ConnectionString — Confluent Cloud: your API key. Leave empty for Mutual TLS or None.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'SASL password. Azure Event Hubs: the full namespace connection string — Confluent Cloud: your API secret. Leave empty for Mutual TLS or None.',
      required: false,
    }),
    useTls: Property.Checkbox({
      displayName: 'Use TLS',
      description: 'Encrypt the connection with TLS/SSL. Required by Azure Event Hubs and Confluent Cloud. Disable only for unsecured PLAINTEXT clusters. Always on when using Mutual TLS.',
      required: false,
      defaultValue: true,
    }),
    ca: Property.LongText({
      displayName: 'CA Certificate',
      description: 'PEM-encoded CA certificate. Only needed when the cluster uses a self-signed or private CA.',
      required: false,
    }),
    clientCert: Property.LongText({
      displayName: 'Client Certificate',
      description: 'PEM-encoded client certificate. Required for Mutual TLS.',
      required: false,
    }),
    clientKey: Property.LongText({
      displayName: 'Client Private Key',
      description: 'PEM-encoded private key of the client certificate. Required for Mutual TLS.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() => kafkaCommon.listTopics({ props: auth }));
    if (error !== null) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not connect to the Kafka cluster.',
      };
    }
    return { valid: true };
  },
});
