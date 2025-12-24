import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { fiservAuth } from './lib/common/auth';

// Party actions
import { createParty } from './lib/actions/parties/create-party';
import { getParty } from './lib/actions/parties/get-party';
import { updateParty } from './lib/actions/parties/update-party';

// Account actions
import { createAccount } from './lib/actions/accounts/create-account';
import { getAccount } from './lib/actions/accounts/get-account';
import { updateAccount } from './lib/actions/accounts/update-account';

// Loan actions - Collateral
import { addCollateral } from './lib/actions/loans/collateral/add-collateral';
import { getCollateral } from './lib/actions/loans/collateral/get-collateral';
import { updateCollateral } from './lib/actions/loans/collateral/update-collateral';
import { deleteCollateral } from './lib/actions/loans/collateral/delete-collateral';

// Loan actions - Escrow
import { addEscrow } from './lib/actions/loans/escrow/add-escrow';
import { getEscrow } from './lib/actions/loans/escrow/get-escrow';
import { updateEscrow } from './lib/actions/loans/escrow/update-escrow';
import { deleteEscrow } from './lib/actions/loans/escrow/delete-escrow';

export const fiserv = createPiece({
  displayName: 'Fiserv',
  auth: fiservAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'logo.png',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    // Party actions (3)
    createParty,
    getParty,
    updateParty,

    // Account actions (3)
    createAccount,
    getAccount,
    updateAccount,

    // Loan actions - Collateral (4)
    addCollateral,
    getCollateral,
    updateCollateral,
    deleteCollateral,

    // Loan actions - Escrow (4)
    addEscrow,
    getEscrow,
    updateEscrow,
    deleteEscrow,
  ],
  triggers: [],
});
