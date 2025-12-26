import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sageworksAuth } from './lib/common/auth';

// Customer actions
import { listCustomers } from './lib/actions/customers/list-customers';
import { createCustomer } from './lib/actions/customers/create-customer';
import { getCustomer } from './lib/actions/customers/get-customer';
import { updateCustomer } from './lib/actions/customers/update-customer';
import { deleteCustomer } from './lib/actions/customers/delete-customer';
import { getCustomerByCrmId } from './lib/actions/customers/get-customer-by-crm-id';

// Portfolio Loan actions
import { listPortfolioLoans } from './lib/actions/portfolio-loans/list-portfolio-loans';
import { createPortfolioLoan } from './lib/actions/portfolio-loans/create-portfolio-loan';
import { getPortfolioLoan } from './lib/actions/portfolio-loans/get-portfolio-loan';
import { updatePortfolioLoan } from './lib/actions/portfolio-loans/update-portfolio-loan';
import { deletePortfolioLoan } from './lib/actions/portfolio-loans/delete-portfolio-loan';

// Proposed Loan actions
import { listProposedLoans } from './lib/actions/proposed-loans/list-proposed-loans';
import { createProposedLoan } from './lib/actions/proposed-loans/create-proposed-loan';
import { getProposedLoan } from './lib/actions/proposed-loans/get-proposed-loan';
import { updateProposedLoan } from './lib/actions/proposed-loans/update-proposed-loan';
import { deleteProposedLoan } from './lib/actions/proposed-loans/delete-proposed-loan';
import { getProposedLoanByCrmId } from './lib/actions/proposed-loans/get-proposed-loan-by-crm-id';

// Collateral actions
import { listCollaterals } from './lib/actions/collaterals/list-collaterals';
import { createCollateral } from './lib/actions/collaterals/create-collateral';
import { getCollateral } from './lib/actions/collaterals/get-collateral';
import { updateCollateral } from './lib/actions/collaterals/update-collateral';
import { deleteCollateral } from './lib/actions/collaterals/delete-collateral';
import { listCollateralBasicInfo } from './lib/actions/collaterals/list-collateral-basic-info';

// Document actions
import { listDocuments } from './lib/actions/documents/list-documents';
import { createDocument } from './lib/actions/documents/create-document';
import { getDocument } from './lib/actions/documents/get-document';
import { updateDocument } from './lib/actions/documents/update-document';
import { deleteDocument } from './lib/actions/documents/delete-document';
import { getDocumentContent } from './lib/actions/documents/get-document-content';
import { listDocumentsByAssociation } from './lib/actions/documents/list-documents-by-association';

// Document Folder actions
import { listDocumentFolders } from './lib/actions/document-folders/list-document-folders';
import { createDocumentFolder } from './lib/actions/document-folders/create-document-folder';
import { getDocumentFolder } from './lib/actions/document-folders/get-document-folder';
import { updateDocumentFolder } from './lib/actions/document-folders/update-document-folder';

// Document Association actions
import { listDocumentAssociations } from './lib/actions/document-associations/list-document-associations';
import { createDocumentAssociation } from './lib/actions/document-associations/create-document-association';
import { getDocumentAssociation } from './lib/actions/document-associations/get-document-association';
import { updateDocumentAssociation } from './lib/actions/document-associations/update-document-association';
import { deleteDocumentAssociation } from './lib/actions/document-associations/delete-document-association';

export const sageworks = createPiece({
  displayName: 'Sageworks',
  auth: sageworksAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://i.imgur.com/Jd6g55Z.jpeg',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  actions: [
    // Customer actions (6)
    listCustomers,
    createCustomer,
    getCustomer,
    getCustomerByCrmId,
    updateCustomer,
    deleteCustomer,

    // Portfolio Loan actions (5)
    listPortfolioLoans,
    createPortfolioLoan,
    getPortfolioLoan,
    updatePortfolioLoan,
    deletePortfolioLoan,

    // Proposed Loan actions (6)
    listProposedLoans,
    createProposedLoan,
    getProposedLoan,
    getProposedLoanByCrmId,
    updateProposedLoan,
    deleteProposedLoan,

    // Collateral actions (6)
    listCollaterals,
    listCollateralBasicInfo,
    createCollateral,
    getCollateral,
    updateCollateral,
    deleteCollateral,

    // Document actions (7)
    listDocuments,
    listDocumentsByAssociation,
    createDocument,
    getDocument,
    getDocumentContent,
    updateDocument,
    deleteDocument,

    // Document Folder actions (4)
    listDocumentFolders,
    createDocumentFolder,
    getDocumentFolder,
    updateDocumentFolder,

    // Document Association actions (5)
    listDocumentAssociations,
    createDocumentAssociation,
    getDocumentAssociation,
    updateDocumentAssociation,
    deleteDocumentAssociation,

    // Custom API Call
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as any).baseUrl || 'https://api.sageworks.com',
      auth: sageworksAuth,
      authMapping: async (auth) => {
        // Get OAuth token
        const response = await fetch('https://auth.sageworks.com/connect/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: (auth as any).clientId,
            client_secret: (auth as any).clientSecret,
            grant_type: 'client_credentials',
          }).toString(),
        });

        const data = await response.json();

        return {
          Authorization: `Bearer ${data.access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
