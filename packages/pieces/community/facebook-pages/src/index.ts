import { PieceAuth, createPiece } from "@activepieces/pieces-framework";

import { createPost } from "./lib/actions/create-post";
import { createPhotoPost } from "./lib/actions/create-photo-post";
import { createVideoPost } from "./lib/actions/create-video-post";

const markdown = `
To Obtain a Client ID and Client Secret:

1. Go to https://developers.facebook.com/
2. Make a new app, Select Other for usecase.
3. Choose Business as the type of app.
5. Fill the App Domain with Domain in Redirect URL.
6. Add new Product -> Facebook Login.
7. Navigate to Facebook Login Settings
8. Copy **Redirect Url Below** to "Valid OAuth Redirect URIs" and "Allowed Domains for the JavaScript SDK"
8. Create a new App Secret, then put the App ID and App Secret into Client ID and Client Secret.
`

export const facebookPagesAuth = PieceAuth.OAuth2({
    
    description: markdown,
    authUrl: "https://graph.facebook.com/oauth/authorize",
    tokenUrl: "https://graph.facebook.com/oauth/access_token",
    required: true,
    scope: ['pages_show_list', 'pages_manage_posts', 'business_management', 'pages_read_engagement'],
})

export const facebookPages = createPiece({
    displayName: "Facebook Pages",
        minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
    authors: ['MoShizzle'],
    auth: facebookPagesAuth,
    actions: [createPost, createPhotoPost, createVideoPost],
    triggers: [],
});
