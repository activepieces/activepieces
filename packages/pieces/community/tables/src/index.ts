import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { insertRecords } from "./lib/actions/insert-records";
import { PieceCategory } from "@activepieces/shared";

export const tables = createPiece({
  displayName: 'Tables',
  logoUrl: 'https://cdn.activepieces.com/pieces/tables.png',
  categories: [PieceCategory.CORE],
  minimumSupportedRelease: '0.36.1',
  authors: ['amrdb'],
  auth: PieceAuth.None(),
  actions: [insertRecords],
  triggers: [],
});
