import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
  StaticPropsValue,
  tryCatch,
} from '@activepieces/pieces-framework';
import { mqttClient } from './common/client';

const description = `Enter the connection settings of your MQTT broker.

**Authentication methods**
- **Anonymous**: no credentials.
- **Username / Password**: fill **Username** and **Password**.
- **Client Certificate (mTLS)**: use \`mqtts://\` or \`wss://\` and paste the **Client Certificate** and **Client Private Key** (PEM). Used by AWS IoT Core and most industrial brokers.
- **Client Certificate + Username / Password**: both of the above.
- **Token (JWT / SAS)**: paste the token in **Password**. For Azure IoT Hub, the username is \`{hub}.azure-devices.net/{deviceId}/?api-version=2021-04-12\`.
- **MQTT 5 Enhanced Authentication**: fill **Authentication Method** and **Authentication Data** (single-step only).

For a broker with a self-signed certificate, paste its **CA Certificate** or turn off **Verify Server Certificate**.`;

const props = {
  protocol: Property.StaticDropdown({
    displayName: 'Protocol',
    description: 'Use mqtts:// or wss:// for TLS-encrypted connections.',
    required: true,
    defaultValue: 'mqtt',
    options: {
      disabled: false,
      options: [
        { label: 'mqtt://', value: 'mqtt' },
        { label: 'mqtts://', value: 'mqtts' },
        { label: 'ws://', value: 'ws' },
        { label: 'wss://', value: 'wss' },
      ],
    },
  }),
  host: Property.ShortText({
    displayName: 'Host',
    description: 'Broker address without protocol, e.g. broker.emqx.io',
    required: true,
  }),
  port: Property.Number({
    displayName: 'Port',
    description: 'Usual ports: 1883 (mqtt), 8883 (mqtts), 8083 (ws), 8084 (wss).',
    required: true,
    defaultValue: 1883,
  }),
  path: Property.ShortText({
    displayName: 'WebSocket Path',
    description: 'Only used with ws:// and wss://.',
    required: false,
    defaultValue: '/mqtt',
  }),
  mqttVersion: Property.StaticDropdown({
    displayName: 'MQTT Version',
    required: true,
    defaultValue: '5',
    options: {
      disabled: false,
      options: [
        { label: '5.0', value: '5' },
        { label: '3.1.1', value: '4' },
        { label: '3.1', value: '3' },
      ],
    },
  }),
  authMethod: Property.StaticDropdown({
    displayName: 'Authentication Method',
    required: true,
    defaultValue: 'username_password',
    options: {
      disabled: false,
      options: [
        { label: 'Anonymous', value: 'none' },
        { label: 'Username / Password', value: 'username_password' },
        { label: 'Client Certificate (mTLS)', value: 'client_certificate' },
        {
          label: 'Client Certificate + Username / Password',
          value: 'client_certificate_and_password',
        },
        { label: 'Token (JWT / SAS)', value: 'token' },
        { label: 'MQTT 5 Enhanced Authentication', value: 'enhanced' },
      ],
    },
  }),
  username: Property.ShortText({
    displayName: 'Username',
    description: 'For Username / Password and Token methods.',
    required: false,
  }),
  password: PieceAuth.SecretText({
    displayName: 'Password or Token',
    description: 'The password, or the JWT / SAS token for the Token method.',
    required: false,
  }),
  clientCertificate: Property.LongText({
    displayName: 'Client Certificate (PEM)',
    description:
      'For Client Certificate methods. Starts with -----BEGIN CERTIFICATE-----',
    required: false,
  }),
  clientKey: PieceAuth.SecretText({
    displayName: 'Client Private Key (PEM)',
    description:
      'For Client Certificate methods. Starts with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----',
    required: false,
  }),
  clientKeyPassphrase: PieceAuth.SecretText({
    displayName: 'Private Key Passphrase',
    description: 'Only if the private key is encrypted.',
    required: false,
  }),
  enhancedAuthMethod: Property.ShortText({
    displayName: 'Authentication Method (MQTT 5)',
    description: 'For MQTT 5 Enhanced Authentication, e.g. the name your broker expects.',
    required: false,
  }),
  enhancedAuthData: PieceAuth.SecretText({
    displayName: 'Authentication Data (MQTT 5)',
    description: 'For MQTT 5 Enhanced Authentication.',
    required: false,
  }),
  caCertificate: Property.LongText({
    displayName: 'CA Certificate (PEM)',
    description:
      'Only needed when the broker uses a self-signed or private CA certificate.',
    required: false,
  }),
  rejectUnauthorized: Property.Checkbox({
    displayName: 'Verify Server Certificate',
    description:
      'Reject brokers whose TLS certificate is invalid or self-signed. Turn off only for testing.',
    required: true,
    defaultValue: true,
  }),
  servername: Property.ShortText({
    displayName: 'TLS Server Name (SNI)',
    description: 'Only if the certificate name differs from the host.',
    required: false,
  }),
  clientIdPrefix: Property.ShortText({
    displayName: 'Client ID Prefix',
    description:
      'Every connection uses a Client ID starting with this prefix. Change it if your broker restricts Client IDs.',
    required: false,
    defaultValue: 'activepieces',
  }),
  connectTimeoutSeconds: Property.Number({
    displayName: 'Connect Timeout (seconds)',
    required: false,
    defaultValue: 10,
  }),
  keepAliveSeconds: Property.Number({
    displayName: 'Keep Alive (seconds)',
    required: false,
    defaultValue: 60,
  }),
};

export const mqttAuth = PieceAuth.CustomAuth({
  displayName: 'MQTT Broker',
  description,
  required: true,
  props,
  validate: async ({ auth }) => {
    const configError = mqttClient.findConfigurationError({ auth });
    if (configError) {
      return { valid: false, error: configError };
    }
    const { error } = await tryCatch(() => mqttClient.verifyConnection({ auth }));
    if (error) {
      return { valid: false, error: mqttClient.describeError({ error }) };
    }
    return { valid: true };
  },
});

export type MqttAuthProps = StaticPropsValue<typeof props>;
export type MqttAuth = AppConnectionValueForAuthProperty<typeof mqttAuth>;
