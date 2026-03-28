import { PieceAuth } from "@activepieces/pieces-framework";

export const canvaAuth = PieceAuth.OAuth2({
    description: "",
    authUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    required: true,
    pkce: true,
    pkceMethod: 'S256',
    scope: [
        "asset:read",
        "asset:write",
        "design:content:read",
        "design:content:write",
        "design:meta:read",
        "folder:read",
        "folder:write",
        "profile:read"
    ]
});
