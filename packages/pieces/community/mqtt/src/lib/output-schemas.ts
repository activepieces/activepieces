import { OutputSchema } from '@activepieces/pieces-framework';

export const publishMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'topic', label: 'Topic' },
    { key: 'qos', label: 'QoS', format: 'number' },
    { key: 'retain', label: 'Retained', format: 'boolean' },
    { key: 'payload_format', label: 'Payload Format' },
    { key: 'payload_size_bytes', label: 'Payload Size', format: 'filesize' },
    { key: 'published_at', label: 'Published At', format: 'datetime' },
  ],
};

export const newMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'topic', label: 'Topic' },
    { key: 'payload', label: 'Payload' },
    { key: 'payload_format', label: 'Payload Format' },
    { key: 'payload_size_bytes', label: 'Payload Size', format: 'filesize' },
    { key: 'qos', label: 'QoS', format: 'number' },
    { key: 'retain', label: 'Retained', format: 'boolean' },
    { key: 'duplicate', label: 'Duplicate Delivery', format: 'boolean' },
    { key: 'received_at', label: 'Received At', format: 'datetime' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'response_topic', label: 'Response Topic' },
    { key: 'correlation_data', label: 'Correlation Data' },
    { key: 'message_expiry_interval', label: 'Message Expiry Interval', format: 'duration' },
    { key: 'user_properties', label: 'User Properties', dynamicKey: true },
  ],
};
