import { PieceAuth } from "@activepieces/pieces-framework";


const authdec = `
`

export const videoaskAuth = PieceAuth.OAuth2({
    description: authdec,
    authUrl: 'https://auth.videoask.com/authorize',
    tokenUrl: 'https://auth.videoask.com/oauth/token',
    required: true,
    scope: [],
})