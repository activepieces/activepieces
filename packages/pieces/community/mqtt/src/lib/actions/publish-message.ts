import { createAction, DynamicPropsValue, Property, tryCatch } from '@activepieces/pieces-framework';
import { IClientPublishOptions } from 'mqtt';
import { mqttAuth } from '../auth';
import { mqttClient } from '../common/client';
import { mqttPayload } from '../common/payload';
import { publishMessageOutputSchema } from '../output-schemas';

export const publishMessage = createAction({
  auth: mqttAuth,
  name: 'publish_message',
  displayName: 'Publish Message',
  description: 'Publishes a message to an MQTT topic.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Publish one message to a topic on the connected MQTT broker, with a JSON, text, Base64, hex or file payload, a QoS level and an optional retain flag. Use to send a command or a value to devices or services listening on that topic. Each call publishes a new message, so retries deliver it again; a retained message replaces the previous retained message on the topic.',
    idempotent: false,
  },
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The topic to publish to, e.g. factory/line1/command. Wildcards (+, #) are not allowed.',
      required: true,
    }),
    payloadFormat: Property.StaticDropdown({
      displayName: 'Payload Format',
      description: 'How the payload is entered and encoded before being sent.',
      required: true,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Plain Text', value: 'text' },
          { label: 'Base64', value: 'base64' },
          { label: 'Hex', value: 'hex' },
          { label: 'File', value: 'file' },
        ],
      },
    }),
    payload: Property.DynamicProperties({
      auth: mqttAuth,
      displayName: 'Payload',
      required: true,
      refreshers: ['payloadFormat'],
      props: async ({ payloadFormat }): Promise<DynamicPropsValue> => {
        switch (payloadFormat) {
          case 'text':
            return {
              text: Property.LongText({
                displayName: 'Payload',
                required: true,
              }),
            };
          case 'base64':
            return {
              base64: Property.LongText({
                displayName: 'Payload (Base64)',
                description: 'SGVsbG8=',
                required: true,
              }),
            };
          case 'hex':
            return {
              hex: Property.ShortText({
                displayName: 'Payload (Hex)',
                description: '48656c6c6f · 48 65 6c 6c 6f',
                required: true,
              }),
            };
          case 'file':
            return {
              file: Property.File({
                displayName: 'Payload',
                required: true,
              }),
            };
          default:
            return {
              json: Property.Json({
                displayName: 'Payload (JSON)',
                required: true,
                defaultValue: { temperature: 21.5, unit: 'C' },
              }),
            };
        }
      },
    }),
    qos: Property.StaticDropdown({
      displayName: 'QoS',
      description:
        '0 = at most once (fastest), 1 = at least once, 2 = exactly once.',
      required: true,
      defaultValue: '0',
      options: {
        disabled: false,
        options: [
          { label: '0 - At most once', value: '0' },
          { label: '1 - At least once', value: '1' },
          { label: '2 - Exactly once', value: '2' },
        ],
      },
    }),
    retain: Property.Checkbox({
      displayName: 'Retain',
      description:
        'The broker keeps this message and sends it to every new subscriber of the topic.',
      required: false,
      defaultValue: false,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type (MQTT 5)',
      description: 'Defaults to application/json for JSON and text/plain for text.',
      required: false,
      advanced: true,
    }),
    messageExpiryInterval: Property.Number({
      displayName: 'Message Expiry Interval (MQTT 5, seconds)',
      description: 'The broker drops the message if it is not delivered within this time.',
      required: false,
      advanced: true,
    }),
    responseTopic: Property.ShortText({
      displayName: 'Response Topic (MQTT 5)',
      description: 'The topic the receiver should reply to (request/response pattern).',
      required: false,
      advanced: true,
    }),
    correlationData: Property.ShortText({
      displayName: 'Correlation Data (MQTT 5)',
      description: 'An identifier echoed back in the reply, to match it to this request.',
      required: false,
      advanced: true,
    }),
    userProperties: Property.Object({
      displayName: 'User Properties (MQTT 5)',
      description: 'Custom key/value headers sent with the message.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: publishMessageOutputSchema,
  async run(context) {
    const auth = context.auth.props;
    const {
      topic,
      payloadFormat,
      payload,
      retain,
      contentType,
      messageExpiryInterval,
      responseTopic,
      correlationData,
      userProperties,
    } = context.propsValue;

    if (/[+#]/.test(topic)) {
      throw new Error('The topic cannot contain the wildcards + or #.');
    }

    const body = mqttPayload.encode({ format: payloadFormat, value: payload?.[payloadFormat] });
    const qos = mqttClient.toQos({ value: context.propsValue.qos });
    const options: IClientPublishOptions = {
      qos,
      retain: retain ?? false,
      properties:
        auth.mqttVersion === '5'
          ? {
              contentType: contentType || mqttPayload.contentTypeFor({ format: payloadFormat }),
              payloadFormatIndicator: payloadFormat === 'json' || payloadFormat === 'text',
              ...(messageExpiryInterval ? { messageExpiryInterval } : {}),
              ...(responseTopic ? { responseTopic } : {}),
              ...(correlationData ? { correlationData: Buffer.from(correlationData, 'utf8') } : {}),
              ...(userProperties ? { userProperties: toUserProperties({ value: userProperties }) } : {}),
            }
          : undefined,
    };

    const { error } = await tryCatch(() =>
      mqttClient.publish({ auth, topic, payload: body, options }),
    );
    if (error) {
      throw new Error(mqttClient.describeError({ error }));
    }

    return {
      topic,
      qos,
      retain: retain ?? false,
      payload_format: payloadFormat,
      payload_size_bytes: body.length,
      published_at: new Date().toISOString(),
    };
  },
});

function toUserProperties({ value }: { value: Record<string, unknown> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === 'string' ? entry : JSON.stringify(entry),
    ]),
  );
}
