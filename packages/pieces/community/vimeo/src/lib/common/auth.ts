import { PieceAuth } from '@activepieces/pieces-framework';

export const vimeoAuth = PieceAuth.OAuth2({
    description: `
    **Vimeo OAuth 2.0 Authentication Setup:**
    
    1. **Register Your App:**
       - Go to the Vimeo Developer Portal: https://developer.vimeo.com/
       - Log in to your Vimeo account
       - Click "Create App" and fill in the required information
    
    2. **Configure OAuth Settings:**
       - On your app's settings page, go to "Authentication"
       - Add \`https://cloud.activepieces.com/redirect\` to the "Callback URLs" field
       - Enable "Authorization Code Grant" for secure authentication
       - Select the required scopes based on your needs (see scope descriptions below)
    
    3. **Get Your Credentials:**
       - Copy the "Client Identifier" (Client ID)
       - Copy the "Client Secret"
       - Paste both values into Activepieces
    
    **Scope Permissions:**
    - **public**: Access public member data
    - **private**: Access private member data (required for most scopes)
    - **purchased**: Access Vimeo On Demand purchase history
    - **create**: Create new resources (showcases, groups, channels, portfolios)
    - **edit**: Edit existing resources including videos
    - **delete**: Delete existing resources including videos
    - **interact**: Like videos, follow members, add comments
    - **upload**: Upload videos to Vimeo
    - **stats**: Access video statistics and analytics
    - **video_files**: Access video files (requires Standard+ membership)
    - **promo_codes**: Manage Vimeo On Demand promotions
    
    **Note:** The 'private' scope is required for any scope other than 'public'. Most integrations require multiple scopes to function properly.
    `,
    authUrl: 'https://api.vimeo.com/oauth/authorize',
    tokenUrl: 'https://api.vimeo.com/oauth/access_token',
    required: true,
    scope: [
        'public',
        'private',
        'purchased',
        'create',
        'edit',
        'delete',
        'interact',
        'upload',
        'stats',
        'video_files',
        'promo_codes'
    ]
});
