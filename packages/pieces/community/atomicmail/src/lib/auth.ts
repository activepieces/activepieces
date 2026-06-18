import { PieceAuth, Property } from '@activepieces/pieces-framework';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export type AtomicmailAuthProps = {
  api_key?: string;
  auth_url?: string;
  api_url?: string;
};

export const atomicmailAuth = PieceAuth.CustomAuth({
  displayName: 'Atomic Mail',
  description:
    'Optional. Leave empty after **Register Inbox** (credentials are saved automatically), or paste an existing API key.',
  required: false,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key (optional)',
      description:
        'Leave empty after Register Inbox, or paste an existing Atomic Mail API key.',
      required: false,
    }),
    auth_url: Property.ShortText({
      displayName: 'Auth URL',
      description: 'Optional auth service URL (default https://auth.atomicmail.ai)',
      required: false,
    }),
    api_url: Property.ShortText({
      displayName: 'API URL',
      description: 'Optional JMAP API URL (default https://api.atomicmail.ai)',
      required: false,
    }),
  },
  validate: async ({ auth }: { auth: AtomicmailAuthProps }) => {
    if (typeof auth.auth_url === 'string' && auth.auth_url.trim().length > 0) {
      if (!isHttpUrl(auth.auth_url.trim())) {
        return { valid: false, error: 'Auth URL must be a valid http(s) URL.' };
      }
    }
    if (typeof auth.api_url === 'string' && auth.api_url.trim().length > 0) {
      if (!isHttpUrl(auth.api_url.trim())) {
        return { valid: false, error: 'API URL must be a valid http(s) URL.' };
      }
    }
    return { valid: true };
  },
} as unknown as Parameters<typeof PieceAuth.CustomAuth>[0]);

export function authEnvFromProps(
  props: AtomicmailAuthProps,
): { authUrl?: string; apiUrl?: string } {
  const env: { authUrl?: string; apiUrl?: string } = {};
  if (props.auth_url?.trim()) env.authUrl = props.auth_url.trim();
  if (props.api_url?.trim()) env.apiUrl = props.api_url.trim();
  return env;
}

export function apiKeyFromProps(props: AtomicmailAuthProps): string | undefined {
  const key = props.api_key?.trim();
  return key && key.length > 0 ? key : undefined;
}
