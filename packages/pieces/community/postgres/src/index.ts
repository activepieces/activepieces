import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { runQuery } from './lib/actions/run-query';
import { findRows } from './lib/actions/find-rows';
import { insertRow } from './lib/actions/insert-row';
import { insertRows } from './lib/actions/insert-rows';
import { updateRow } from './lib/actions/update-row';
import { deleteRow } from './lib/actions/delete-row';
import { getTables } from './lib/actions/get-tables';
import { newRow } from './lib/triggers/new-row';
import { postgresAuth } from './lib/auth';
import { postgresAiActions } from './lib/actions/ai';

export { postgresAuth };

export const postgres = createPiece({
  displayName: 'Postgres',
  description: "The world's most advanced open-source relational database",
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  logoUrl: 'https://cdn.activepieces.com/pieces/postgres.png',
  authors: ["AbdullahBitar", "Willianwg", "dentych", "kishanprmr", "AbdulTheActivePiecer", "khaledmashaly", "abuaboud"],
  auth: postgresAuth,
  actions: [findRows, insertRow, insertRows, updateRow, deleteRow, getTables, runQuery, ...postgresAiActions],
  triggers: [newRow],
});
