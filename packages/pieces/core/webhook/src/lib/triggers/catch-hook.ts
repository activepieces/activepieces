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
} from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'crypto';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
Runs the published flow.
`;

const testMarkdown = `**Test URL:** add \`/test\` to the end to save sample data without running the flow.`;

const syncMarkdown = `**Wait for a reply:** add \`/sync\` to the end of the URL and add a **Return Response** step. Without a reply in {{webhookTimeoutSeconds}} seconds, the caller gets a 408 Request Timeout.`;

export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  HEADER = 'header',
  HMAC = 'hmac',
}
export const catchWebhook = createTrigger({
  name: 'catch_webhook',
  classification: 'READ',
  displayName: 'Catch Webhook',
  description:
    'Starts the flow on each HTTP request to its unique URL.',
  aiMetadata: {
    description: 'Fires once for every request delivered to the unique webhook URL generated for this flow, under any HTTP method. Use it as the entry point for any system that can call a URL; Authentication must be set explicitly to None, Basic credentials, a shared header value, or an HMAC signature over the raw body, and requests that fail verification are rejected and recorded as a failed run instead of starting the flow. Appending /sync to the URL makes the caller wait for a Return Response action, while /test generates sample data without triggering the published flow.',
  },
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    testMarkdown: Property.MarkDown({
      value: testMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    syncMarkdown: Property.MarkDown({
      value: syncMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    authType: Property.StaticDropdown<AuthType>({
      displayName: 'Authentication',
      description: 'Requests that fail the check end as a failed run.',
      display: 'cards',
      required: true,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          {
            label: 'None',
            value: AuthType.NONE,
            description: 'Open URL',
            icon: 'blank',
          },
          {
            label: 'Basic Auth',
            value: AuthType.BASIC,
            description: 'Login details',
            icon: 'user',
          },
          {
            label: 'Header Auth',
            value: AuthType.HEADER,
            description: 'Secret header',
            icon: 'tag',
          },
          {
            label: 'HMAC',
            value: AuthType.HMAC,
            description: 'Signed body',
            icon: 'code',
          },
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
                description: 'Callers must send this username.',
                required: true,
              }),
              password: Property.ShortText({
                displayName: 'Password',
                description: 'Callers must send this password.',
                required: true,
              }),
            };
            break;
          case AuthType.HEADER:
            fields = {
              headerName: Property.ShortText({
                displayName: 'Header Name',
                description: 'Header callers put the secret in.',
                placeholder: 'X-Api-Key',
                required: true,
              }),
              headerValue: Property.ShortText({
                displayName: 'Header Value',
                description: 'Requests must carry exactly this value.',
                required: true,
              }),
            };
            break;
          case AuthType.HMAC:
            fields = {
              hmacHeaderName: Property.ShortText({
                displayName: 'Signature Header Name',
                description: 'Header that holds the signature.',
                placeholder: 'X-Hub-Signature-256',
                required: true,
                defaultValue: 'x-signature',
              }),
              hmacSecret: Property.ShortText({
                displayName: 'Secret',
                description: 'Shared secret the sender signs the raw body with.',
                required: true,
              }),
              hmacAlgorithm: Property.StaticDropdown({
                displayName: 'Algorithm',
                description: "Must match the sender's algorithm.",
                display: 'cards',
                required: true,
                defaultValue: 'sha256',
                options: {
                  disabled: false,
                  options: [
                    {
                      label: 'SHA-256',
                      value: 'sha256',
                      description: 'Recommended',
                    },
                    { label: 'SHA-1', value: 'sha1', description: 'Older senders' },
                    {
                      label: 'SHA-512',
                      value: 'sha512',
                      description: 'Longer hash',
                    },
                  ],
                },
              }),
              hmacEncoding: Property.StaticDropdown({
                displayName: 'Signature Encoding',
                description: 'How the sender encodes the signature.',
                display: 'cards',
                required: true,
                defaultValue: 'hex',
                options: {
                  disabled: false,
                  options: [
                    {
                      label: 'Hexadecimal',
                      value: 'hex',
                      description: '0-9, a-f',
                    },
                    {
                      label: 'Base64',
                      value: 'base64',
                      description: 'A-Z, a-z, 0-9',
                    },
                  ],
                },
              }),
              hmacSignaturePrefix: Property.ShortText({
                displayName: 'Signature Prefix',
                description: 'Stripped before checking; requests without it fail.',
                placeholder: 'sha256=',
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
  propertyGroups: [
    {
      key: 'url',
      display: 'section',
      label: 'Webhook URL',
      icon: 'send',
      props: ['liveMarkdown', 'testMarkdown', 'syncMarkdown'],
    },
    {
      key: 'authentication',
      display: 'section',
      label: 'Security',
      icon: 'user',
      props: ['authType', 'authFields'],
    },
  ],
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
      throw new Error(
        `Webhook authentication failed: request did not pass the configured ${authenticationType} check`
      );
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
  headerName: string | undefined,
  headerSecret: string | undefined
) {
  if (!headerName || !headerSecret) {
    return false;
  }
  const headerValue = headers[headerName.toLocaleLowerCase()];
  return headerValue === headerSecret;
}

function verifyBasicAuth(
  headerValue: string | undefined,
  username: string | undefined,
  password: string | undefined
) {
  if (!headerValue || !username || !password) {
    return false;
  }
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
  headerName: string | undefined,
  secret: string | undefined,
  algorithm: string,
  encoding: 'hex' | 'base64',
  signaturePrefix: string
): boolean {
  if (!headerName || !secret) {
    return false;
  }
  // Get signature from header
  const headerValue = headers[headerName.toLowerCase()];
  if (!headerValue) {
    return false;
  }

  // Strip prefix if specified, or reject if prefix is configured but missing
  let receivedSignature = headerValue;
  if (signaturePrefix) {
    if (!headerValue.startsWith(signaturePrefix)) {
      return false;
    }
    receivedSignature = headerValue.substring(signaturePrefix.length);
  }

  // Convert rawBody to string for HMAC computation
  // rawBody should ideally be the raw unparsed request body (string or Buffer)
  // to ensure the signature matches the exact bytes sent by the webhook provider.
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
