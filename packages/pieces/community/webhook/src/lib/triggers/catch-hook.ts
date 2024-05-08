import {
  createTrigger,
  DynamicPropsValue,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';

const message = `

**Production URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`

**Testing URL:**
\`\`\`text
{{webhookUrl}}/test
\`\`\`
***Use this URL for testing the webhook and saving sample data. It won't start the flow***.

**Notes:**
- If you are expecting a reply from this webhook, append **/sync** to the URL in that case, you will also have to add an HTTP step with **return response** at the end of your flow.
- If the flow takes more than **30 seconds**, it will give a **408 Request Timeout** response.
`;

enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  HEADER = 'header',
}
export const catchWebhook = createTrigger({
  name: 'catch_webhook',
  displayName: 'Catch Webhook',
  description:
    'Receive incoming HTTP/webhooks using any HTTP method such as GET, POST, PUT, DELETE, etc.',
  props: {
    markdown: Property.MarkDown({
      value: message,
    }),
    authType: Property.StaticDropdown<AuthType>({
      displayName: 'Authentication',
      required: true,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: AuthType.NONE },
          { label: 'Basic Auth', value: AuthType.BASIC },
          { label: 'Header Auth', value: AuthType.HEADER },
        ],
      },
    }),
    authFields: Property.DynamicProperties({
      displayName: 'Authentication Fields',
      required: false,
      refreshers: ['authType'],
      props: async ({ authType }) => {
        const authTypeEnum = authType.toString() as AuthType;
        let fields: DynamicPropsValue = {};
        switch (authTypeEnum) {
          case AuthType.NONE:
            fields = {};
            break;
          case AuthType.BASIC:
            fields = {
              username: Property.ShortText({
                displayName: 'Username',
                description: 'The username to use for authentication.',
                required: true,
              }),
              password: Property.ShortText({
                displayName: 'Password',
                description: 'The password to use for authentication.',
                required: true,
              }),
            };
            break;
          case AuthType.HEADER:
            fields = {
              headerName: Property.ShortText({
                displayName: 'Header Name',
                description: 'The name of the header to use for authentication.',
                required: true,
              }),
              headerValue: Property.ShortText({
                displayName: 'Header Value',
                description: 'The value to check against the header.',
                required: true,
              }),
            };
            break;
          default:
            throw new Error('Invalid authentication type');
        }
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
    const authenticationType = context.propsValue.authType;
    assertNotNullOrUndefined(authenticationType, 'Authentication type is required');
    const verified = verifyAuth(authenticationType, context.propsValue.authFields ?? {}, context.payload.headers);
    if (!verified) {
      return []
    }
    return [context.payload]
  },
});

function verifyAuth(authenticationType: AuthType, authFields: DynamicPropsValue, headers: Record<string, string>): boolean {
  switch (authenticationType) {
    case AuthType.NONE:
      return true;
    case AuthType.BASIC:
      return verifyBasicAuth(headers['authorization'], authFields['username'], authFields['password']);
    case AuthType.HEADER:
      return verifyHeaderAuth(headers, authFields['headerName'], authFields['headerValue']);
    default:
      throw new Error('Invalid authentication type');
  }
}

function verifyHeaderAuth(headers: Record<string, string>, headerName: string, headerSecret: string) {
  const headerValue = headers[headerName.toLocaleLowerCase()];
  return headerValue === headerSecret;
}

function verifyBasicAuth(headerValue: string, username: string, password: string) {
  if (!headerValue.toLocaleLowerCase().startsWith('basic ')) {
    return false;
  }
  const auth = headerValue.substring(6);
  const decodedAuth = Buffer.from(auth, 'base64').toString();
  const [receivedUsername, receivedPassword] = decodedAuth.split(':');
  return receivedUsername === username && receivedPassword === password;
}
