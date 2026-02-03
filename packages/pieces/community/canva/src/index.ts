import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { uploadAsset } from "./lib/actions/upload-asset";
import { createDesign } from "./lib/actions/create-design";

export const canvaAuth = PieceAuth.OAuth2({
    description: "",
    authUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/tokens",
    required: true,
    scope: [
        "asset:read",
        "asset:write",
        "design:content:read",
        "design:content:write",
        "design:meta:read",
        "folder:read",
        "folder:write"
    ],
});

export const canva = createPiece({
    displayName: "Canva",
    description: "Graphic design platform.",
    auth: canvaAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: "https://cdn.activepieces.com/pieces/canva.png",
    authors: [],
    categories: [PieceCategory.MARKETING],
    actions: [uploadAsset, createDesign],
    triggers: [],
});
