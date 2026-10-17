import { PieceAuth, Property } from '@activepieces/pieces-framework'
import { kafkaClient } from './common/client'

export const kafkaAuth = PieceAuth.CustomAuth({
  description: 'Connect with bootstrap servers and SASL or SSL credentials.',
  required: true,
  props: {
    setup: Property.MarkDown({
      value: `1. Copy the cluster bootstrap servers as host:port pairs, separated by commas. Example: kafka-1.internal:9092, kafka-2.internal:9092.
2. Choose the security protocol the cluster uses.
3. For SASL_PLAINTEXT or SASL_SSL, choose the mechanism and enter the username and password.
4. For SSL or SASL_SSL, leave server certificate verification on unless the cluster uses a private CA. Paste that CA in the certificate field.`,
    }),
    brokers: Property.ShortText({
      displayName: 'Bootstrap servers',
      description: 'Comma-separated host:port pairs, for example kafka-1.internal:9092, kafka-2.internal:9092.',
      required: true,
    }),
    securityProtocol: Property.StaticDropdown({
      displayName: 'Security protocol',
      description: 'How the worker connects to the brokers.',
      required: true,
      defaultValue: 'SASL_SSL',
      options: {
        options: [
          { label: 'SASL_SSL', value: 'SASL_SSL' },
          { label: 'SASL_PLAINTEXT', value: 'SASL_PLAINTEXT' },
          { label: 'SSL', value: 'SSL' },
          { label: 'PLAINTEXT', value: 'PLAINTEXT' },
        ],
      },
    }),
    saslMechanism: Property.StaticDropdown({
      displayName: 'SASL mechanism',
      description: 'Required for SASL_SSL and SASL_PLAINTEXT. Ignored for SSL and PLAINTEXT.',
      required: false,
      options: {
        options: [
          { label: 'PLAIN', value: 'plain' },
          { label: 'SCRAM-SHA-256', value: 'scram-sha-256' },
          { label: 'SCRAM-SHA-512', value: 'scram-sha-512' },
        ],
      },
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'SASL username. Required for SASL_SSL and SASL_PLAINTEXT.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'SASL password. Required for SASL_SSL and SASL_PLAINTEXT.',
      required: false,
    }),
    rejectUnauthorized: Property.Checkbox({
      displayName: 'Verify server certificate',
      description: 'Applies to SSL and SASL_SSL. Turn this off only for a cluster that uses a certificate this worker cannot verify.',
      required: true,
      defaultValue: true,
    }),
    caCertificate: Property.LongText({
      displayName: 'CA certificate',
      description: 'Optional PEM CA certificate for a private certificate authority. Used with SSL and SASL_SSL.',
      required: false,
    }),
  },
  validate: async ({ auth }) => kafkaClient.validate(auth),
  getConnectionIdentifier: async ({ auth }) => auth.brokers,
})
