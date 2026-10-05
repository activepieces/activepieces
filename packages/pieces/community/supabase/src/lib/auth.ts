import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
### Connect your Supabase project
1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Copy the **Project URL** from **Project Settings → Data API**, or use your self-hosted URL.
3. Copy a key from **Project Settings → API Keys**.

Use the **secret** key (\`sb_secret_…\`) or the legacy **service_role** key: it bypasses Row Level Security, so keep it private. The **publishable** or legacy **anon** key only reaches what your Row Level Security policies allow.
`;

export const supabaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    url: Property.ShortText({
      displayName: 'Project URL',
      description: 'Your project URL, like https://abcd1234.supabase.co, or your self-hosted URL.',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'A secret or service_role key. Publishable/anon keys only reach what RLS allows.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const url = auth.url;
      const apiKey = auth.apiKey;

      if (url !== url.trim()) {
        return {
          valid: false,
          error: 'Remove the spaces before or after the Project URL.',
        };
      }

      const urlError = findUrlError(url);
      if (urlError) {
        return { valid: false, error: urlError };
      }

      if (apiKey !== apiKey.trim()) {
        return {
          valid: false,
          error: 'Remove the spaces before or after the API key.',
        };
      }

      if (apiKey.startsWith('sbp_')) {
        return {
          valid: false,
          error: 'This is a personal access token. Use a project API key from Project Settings → API Keys.',
        };
      }

      return await probeApiKey({ baseUrl: stripTrailingSlashes(url), apiKey });
    } catch (error) {
      return {
        valid: false,
        error: `Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your URL and API key.`,
      };
    }
  },
});

function findUrlError(url: string): string | null {
  const parsedUrl = parseUrl(url);
  if (!parsedUrl) {
    return 'Please enter a valid URL';
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return 'URL must start with https:// or http://';
  }
  if (parsedUrl.username !== '' || parsedUrl.password !== '') {
    return 'URL must not contain a username or password';
  }
  return null;
}

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

async function probeApiKey({ baseUrl, apiKey }: { baseUrl: string; apiKey: string }): Promise<ValidationResult> {
  try {
    const response = await fetch(`${baseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: apiKey,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        valid: false,
        error: 'Supabase rejected this API key. Copy it again from Project Settings → API Keys.',
      };
    }

    const errorText = await response.text();
    return {
      valid: false,
      error: `HTTP ${response.status}: ${errorText}. Please verify your URL and API key.`,
    };
  } catch (networkError) {
    return {
      valid: false,
      error: `Network error: ${networkError instanceof Error ? networkError.message : 'Could not connect to Supabase'}. Please check your URL.`,
    };
  }
}

type ValidationResult = { valid: true } | { valid: false; error: string };
