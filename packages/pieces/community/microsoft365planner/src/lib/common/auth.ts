import { PieceAuth, OAuth2AuthorizationMethod } from "@activepieces/pieces-framework";

export const MicrosoftPlannerAuth = PieceAuth.OAuth2({
    description: 'Connect your Microsoft 365 Planner account',

    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',

    required: true,

    scope: [
        'https://graph.microsoft.com/Tasks.ReadWrite',
        'https://graph.microsoft.com/Group.ReadWrite.All',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
        'openid',
        'email',
        'profile'
    ],
    pkce: true,
    pkceMethod: 'S256',
    authorizationMethod: OAuth2AuthorizationMethod.HEADER,
    extra: {
        access_type: 'offline',
        prompt: 'consent',
    },
});
