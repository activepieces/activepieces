import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { mondayCreateAnItem } from "./lib/actions/create-item";
import { mondayUpdateAnItem } from "./lib/actions/update-item";
import { mondayGetItemColumnValues } from "./lib/actions/get-column-value-by-item";
import { mondayItemCreatedTrigger } from "./lib/triggers/item-created-trigger";
import { mondayNewUpdatesTrigger } from "./lib/triggers/new-update-trigger";
import { mondayGetItemByColumnValues } from './lib/actions/get-item-by-column-value';

export const mondayAuth = PieceAuth.OAuth2({
  
  description: "OAuth2.0 Authentication",
  authUrl: "https://auth.monday.com/oauth2/authorize",
  tokenUrl: "https://auth.monday.com/oauth2/token",
  required: true,
  scope: [
    'workspaces:read',
    'boards:read',
    'boards:write',
    'updates:read',
    'updates:write',
  ]
})

export const monday = createPiece({
  displayName: "Monday",
      minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/monday.png",
  authors: ['kanarelo'],
  auth: mondayAuth,
  actions: [mondayCreateAnItem, mondayUpdateAnItem, mondayGetItemColumnValues, mondayGetItemByColumnValues],
  triggers: [mondayItemCreatedTrigger, mondayNewUpdatesTrigger],
});
