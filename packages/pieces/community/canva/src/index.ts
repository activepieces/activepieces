import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { uploadAssetAction } from "./lib/actions/upload-asset";
import { listDesignsAction } from "./lib/actions/list-designs";
import { searchDesignsAction } from "./lib/actions/search-designs";
import { listFoldersAction } from "./lib/actions/list-folders";
import { createFolderAction } from "./lib/actions/create-folder";
import { canvaAuth } from "./lib/auth";

export const canva = createPiece({
  displayName: "Canva [MCP]",
  auth: canvaAuth,
  minimumSupportedRelease: '0.50.2',
  logoUrl: "https://cdn.activepieces.com/pieces/canva.png",
  authors: ['Angelebeats'],
  description: 'Integrate with Canva Connect API to manage designs and assets.',
  actions: [
    uploadAssetAction,
    listDesignsAction,
    searchDesignsAction,
    listFoldersAction,
    createFolderAction
  ],
  triggers: [],
  categories: [PieceCategory.MARKETING, PieceCategory.PRODUCTIVITY]
});
