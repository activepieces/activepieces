import {
  createTrigger,
  DynamicPropsValue,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  assertNotNullOrUndefined,
  MarkdownVariant,
} from '@activepieces/shared';
import { createHmac, timingSafeEqual } from 'crypto';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
generate sample data & triggers published flow.

`;

const testMarkdown = `
**Test URL:**

if you want to generate sample data without triggering the flow, append \`/test\` to your webhook URL.

`;

const syncMarkdown = `**Synchronous Requests:**

If you expect a response from this webhook, add \`/sync\` to the end of the URL. 
If it takes more than 30 seconds, it will return a 408 Request Timeout response.

To return data, add an Webhook step to your flow with the Return Response action.
`;

enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  HEADER = 'header',
  HMAC = 'hmac',
}
export const catchWebhook = createTrigger({
  name: 'catch_webhook',
  displayName: 'Catch Webhook',
  description:
    'Receive incoming HTTP/webhooks using any HTTP method such as GET, POST, PUT, DELETE, etc.',
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    syncMarkdown: Property.MarkDown({
      value: syncMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    testMarkdown: Property.MarkDown({
      value: testMarkdown,
      variant: MarkdownVariant.INFO,
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
          { label: 'HMAC Signature', value: AuthType.HMAC },
        ],
      },
    }),
    authFields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Authentication Fields',
      required: false,
      refreshers: ['authType'],
      props: async ({ authType }) => {
        if (!authType) {
          return {};
        }
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
                description:
                  'The name of the header to use for authentication.',
                required: true,
              }),
              headerValue: Property.ShortText({
                displayName: 'Header Value',
                description: 'The value to check against the header.',
                required: true,
              }),
            };
            break;
          case AuthType.HMAC:
            fields = {
              hmacHeaderName: Property.ShortText({
                displayName: 'Signature Header Name',
                description:
                  'The HTTP header containing the HMAC signature (e.g., X-Signature, X-Hub-Signature-256)',
                required: true,
                defaultValue: 'x-signature',
              }),
              hmacSecret: Property.ShortText({
                displayName: 'Secret',
                description:
                  'The shared secret used for HMAC signature verification',
                required: true,
              }),
              hmacAlgorithm: Property.StaticDropdown({
                displayName: 'Algorithm',
                description: 'The hash algorithm used for HMAC computation',
                required: true,
                defaultValue: 'sha256',
                options: {
                  disabled: false,
                  options: [
                    { label: 'SHA-256 (Recommended)', value: 'sha256' },
                    { label: 'SHA-1', value: 'sha1' },
                    { label: 'SHA-512', value: 'sha512' },
                  ],
                },
              }),
              hmacEncoding: Property.StaticDropdown({
                displayName: 'Signature Encoding',
                description: 'How the signature is encoded in the header',
                required: true,
                defaultValue: 'hex',
                options: {
                  disabled: false,
                  options: [
                    { label: 'Hexadecimal', value: 'hex' },
                    { label: 'Base64', value: 'base64' },
                  ],
                },
              }),
              hmacSignaturePrefix: Property.ShortText({
                displayName: 'Signature Prefix',
                description:
                  'Optional prefix to strip from signature (e.g., "sha256=" for GitHub webhooks). Leave empty if no prefix.',
                required: false,
                defaultValue: '',
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
    assertNotNullOrUndefined(
      authenticationType,
      'Authentication type is required'
    );
    const verified = verifyAuth(
      authenticationType,
      context.propsValue.authFields ?? {},
      context.payload.headers,
      context.payload.rawBody
    );
    if (!verified) {
      return [];
    }
    return [context.payload];
  },
});

function verifyAuth(
  authenticationType: AuthType,
  authFields: DynamicPropsValue,
  headers: Record<string, string>,
  rawBody?: unknown
): boolean {
  switch (authenticationType) {
    case AuthType.NONE:
      return true;
    case AuthType.BASIC:
      return verifyBasicAuth(
        headers['authorization'],
        authFields['username'],
        authFields['password']
      );
    case AuthType.HEADER:
      return verifyHeaderAuth(
        headers,
        authFields['headerName'],
        authFields['headerValue']
      );
    case AuthType.HMAC:
      return verifyHmacAuth(
        headers,
        rawBody,
        authFields['hmacHeaderName'],
        authFields['hmacSecret'],
        authFields['hmacAlgorithm'] ?? 'sha256',
        authFields['hmacEncoding'] ?? 'hex',
        authFields['hmacSignaturePrefix'] ?? ''
      );
    default:
      throw new Error('Invalid authentication type');
  }
}

function verifyHeaderAuth(
  headers: Record<string, string>,
  headerName: string,
  headerSecret: string
) {
  const headerValue = headers[headerName.toLocaleLowerCase()];
  return headerValue === headerSecret;
}

function verifyBasicAuth(
  headerValue: string,
  username: string,
  password: string
) {
  if (!headerValue.toLocaleLowerCase().startsWith('basic ')) {
    return false;
  }
  const auth = headerValue.substring(6);
  const decodedAuth = Buffer.from(auth, 'base64').toString();
  const [receivedUsername, receivedPassword] = decodedAuth.split(':');
  return receivedUsername === username && receivedPassword === password;
}

export function verifyHmacAuth(
  headers: Record<string, string>,
  rawBody: unknown,
  headerName: string,
  secret: string,
  algorithm: string,
  encoding: 'hex' | 'base64',
  signaturePrefix: string
): boolean {
  // Get signature from header
  const headerValue = headers[headerName.toLowerCase()];
  if (!headerValue) {
    return false;
  }

  // Strip prefix if specified
  let receivedSignature = headerValue;
  if (signaturePrefix && headerValue.startsWith(signaturePrefix)) {
    receivedSignature = headerValue.substring(signaturePrefix.length);
  }

  // Convert rawBody to string for HMAC computation
  let bodyString: string;
  if (rawBody instanceof Buffer) {
    bodyString = rawBody.toString('utf8');
  } else if (typeof rawBody === 'string') {
    bodyString = rawBody;
  } else if (rawBody === undefined || rawBody === null) {
    bodyString = '';
  } else {
    bodyString = JSON.stringify(rawBody);
  }

  // Compute HMAC
  const hmac = createHmac(algorithm, secret);
  hmac.update(bodyString);
  const expectedSignature = hmac.digest(encoding);

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
