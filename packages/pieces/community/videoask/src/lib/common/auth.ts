import { PieceAuth } from "@activepieces/pieces-framework";

export const videoaskAuth = PieceAuth.OAuth2({
    description: 'Connect your VideoAsk account',
    authUrl: 'https://auth.videoask.com/authorize',
    tokenUrl: 'https://auth.videoask.com/oauth/token',
    required: true,
    scope: [],
})