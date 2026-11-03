import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { deleteRows } from './lib/actions/delete-rows';
import { findRows } from './lib/actions/find-rows';
import { insertRows } from './lib/actions/insert-rows';
import { runQuery } from './lib/actions/run-query';
import { updateRows } from './lib/actions/update-rows';
import { redshiftAuth } from './lib/auth';
import { newOrUpdatedRow } from './lib/triggers/new-or-updated-row';
import { newRow } from './lib/triggers/new-row';

export const amazonRedshift = createPiece({
  displayName: 'Amazon Redshift',
  description: 'Fully managed cloud data warehouse from AWS.',
  minimumSupportedRelease: '0.90.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-redshift.png',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['kishanprmr'],
  auth: redshiftAuth,
  actions: [insertRows, updateRows, deleteRows, findRows, runQuery],
  triggers: [newRow, newOrUpdatedRow],
});
