import { PieceAuth, createPiece } from "@activepieces/pieces-framework";

import { createPost } from "./lib/actions/create-post";
import { createPhotoPost } from "./lib/actions/create-photo-post";
import { createVideoPost } from "./lib/actions/create-video-post";

const markdown = `
To Obtain the following credentials:
1. Visit https://developers.facebook.com/
2. Create an application, Select Other for Usecase.
3. Select Business as App Type.
4. Copy App Id and App Secret from Basic Settings.
`

export const facebookPagesAuth = PieceAuth.OAuth2({
    displayName: 'Authentication',
    description: markdown,
    authUrl: "https://graph.facebook.com/oauth/authorize",
    tokenUrl: "https://graph.facebook.com/oauth/access_token",
    required: true,
    scope: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'],
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
