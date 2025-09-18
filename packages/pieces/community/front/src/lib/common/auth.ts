import { PieceAuth, OAuth2AuthorizationMethod } from "@activepieces/pieces-framework";

export const frontAuth = PieceAuth.OAuth2({
    description: 'Connect your Klaviyo account',
    authUrl: 'https://app.frontapp.com/oauth/authorize',
    tokenUrl: 'https://app.frontapp.com/oauth/token',
    required: true,
    scope: [
    ],

})