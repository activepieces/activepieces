import { PieceAuth, OAuth2AuthorizationMethod } from "@activepieces/pieces-framework";

export const klaviyoAuth = PieceAuth.OAuth2({
    description: 'Connect your Klaviyo account',
    authUrl: 'https://www.klaviyo.com/oauth/authorize',
    tokenUrl: 'https://a.klaviyo.com/oauth/token',
    required: true,
    scope: [
        'profiles:read',
        'profiles:write', 
        'lists:read',
        'lists:write',
        'tags:read',
        'segments:read',
        'events:read',
        'events:write',
        'subscriptions:read',
        'subscriptions:write'
    ],
    pkce: true,
    pkceMethod: 'S256',
    authorizationMethod: OAuth2AuthorizationMethod.HEADER,
    extra: {
        // Override parameters that Klaviyo doesn't support
        access_type: '',
        prompt: ''
    }
})