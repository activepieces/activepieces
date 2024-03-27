import {
  createTrigger,
  DynamicPropsValue,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const message = `
Copy the following URL:
**{{webhookUrl}}**


If you are expecting a reply from this webhook, append **/sync** to the URL.

In that case, you will also have to add an HTTP step with **return response** at the end of your flow.

If the flow takes more than **30 seconds**, it will give a **408 Request Timeout** response.
`;

export const catchWebhook = createTrigger({
  name: 'catch_webhook',
  displayName: 'Catch Webhook',
  description:
    'Receive incoming HTTP/webhooks using any HTTP method such as GET, POST, PUT, DELETE, etc.',
  props: {
    markdown: Property.MarkDown({
      value: message,
    }),
    authentication: Property.StaticDropdown({
      displayName: 'Authentication',
      required: true,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'none' },
          //{ label: 'Basic Auth', value: 'basic' },
          { label: 'Bearer Token', value: 'bearer' },
        ],
      },
    }),
    auth_fields: Property.DynamicProperties({
      displayName: 'Authentication Fields',
      required: false,
      refreshers: ['authentication'],
      props: async ({ authentication }) => {
        const auth_str = authentication.toString();

        if (auth_str === 'none') {
          return {};
        }

        const fields: DynamicPropsValue = {};

        fields['header_name'] = Property.ShortText({
          displayName: 'Header Name',
          description: 'The name of the header to use for authentication.',
          required: true,
        });

        fields['header_value'] = Property.ShortText({
          displayName: 'Header Value',
          description: 'The value to check against the header.',
          required: true,
        });

        return fields;
      },
    }),
  },
  sampleData: null,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    const required_auth = context.propsValue.authentication.toString();

    if (required_auth === 'none') {
      return [context.payload];
    } else {
      const fields = context.propsValue.auth_fields;
      const header_name = fields?.['header_name'] as string;
      const header_value = fields?.['header_value'] as string;

      if (!header_name || !header_value) {
        throw new Error('Authentication fields are required.');
      }

      const received_headers = context.payload.headers;

      const received_header_value = received_headers[header_name.toLowerCase()];

      if (!received_header_value) {
        throw new Error(`Invalid Authentication Headers`);
      }

      if (received_header_value !== header_value) {
        throw new Error(`Invalid Authentication Header Value`);
      }

      return [context.payload];
    }
  },
});
