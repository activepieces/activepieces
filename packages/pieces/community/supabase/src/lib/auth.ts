import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
## Supabase Connection Setup

### 1. Get Your Project URL
- Go to your [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to **Settings** → **API**
- Copy the **Project URL** (format: \`https://your-project-ref.supabase.co\`)

### 2. Get Your API Key
Choose the appropriate key based on your use case:

**For Actions (Database Operations):**
- Use **Service Role Key** (secret) for server-side operations
- Has full access to bypass Row Level Security (RLS)

**For Triggers (Webhooks):**
- Use **Anonymous Key** (public) if your webhooks don't need elevated permissions
- Use **Service Role Key** for elevated permissions

**Security Note:** Keep your Service Role Key secret - it bypasses all RLS policies.

Find your keys in **Settings** → **API** → **Project API keys**
`;

export const supabaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    url: Property.ShortText({
      displayName: 'Project URL',
      description: 'Your Supabase project URL (e.g., https://your-project-ref.supabase.co)',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Service Role Key (for actions) or Anonymous Key (for basic triggers)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const { url, apiKey } = auth;
      
      try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.hostname.endsWith('.supabase.co')) {
          return {
            valid: false,
            error: 'URL must be a valid Supabase project URL (e.g., https://your-project-ref.supabase.co)'
          };
        }
        if (parsedUrl.protocol !== 'https:') {
          return {
            valid: false,
            error: 'URL must use HTTPS protocol'
          };
        }
      } catch {
        return {
          valid: false,
          error: 'Please enter a valid URL'
        };
      }
      
      if (!apiKey.startsWith('eyJ') && !apiKey.startsWith('sbp_')) {
        return {
          valid: false,
          error: 'Invalid API key format. Use either the Service Role Key or Anonymous Key from your Supabase project settings'
        };
      }
      
      try {
        const response = await fetch(`${url}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status >= 200 && response.status < 300) {
          return { valid: true };
        }
        
        if (response.status === 401 || response.status === 403) {
          return { valid: true };
        }
        
        const errorText = await response.text();
        return {
          valid: false,
          error: `HTTP ${response.status}: ${errorText}. Please verify your URL and API key.`
        };
        
      } catch (networkError) {
        return {
          valid: false,
          error: `Network error: ${networkError instanceof Error ? networkError.message : 'Could not connect to Supabase'}. Please check your URL.`
        };
      }
      
    } catch (error) {
      return {
        valid: false,
        error: `Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your URL and API key.`
      };
    }
  }
});
