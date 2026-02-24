import { createPiece } from "@activepieces/pieces-framework";
import { sapAribaAuth } from "./lib/auth";
import { listPurchaseOrders } from "./lib/actions/list-purchase-orders";
import { listPurchaseOrderItems } from "./lib/actions/list-purchase-order-items";
import { getDocumentChanges } from "./lib/actions/get-document-changes";
import { getPendingApprovables } from "./lib/actions/get-pending-approvables";
import { getCatalogItems } from "./lib/actions/get-catalog-items";
import { getActiveCatalogs } from "./lib/actions/get-active-catalogs";
import { getFacetData } from "./lib/actions/get-facet-data";
import { listInvoices } from "./lib/actions/list-invoices";
import { searchContractWorkspaces } from "./lib/actions/search-contract-workspaces";
import { getContractWorkspace } from "./lib/actions/get-contract-workspace";
import { createContractWorkspace } from "./lib/actions/create-contract-workspace";
import { updateContractWorkspace } from "./lib/actions/update-contract-workspace";
import { updateContractStatus } from "./lib/actions/update-contract-status";
import { deleteContractWorkspace } from "./lib/actions/delete-contract-workspace";
import { PieceCategory } from "@activepieces/shared";

export const sapAriba = createPiece({
  displayName: "SAP Ariba",
  description: "Automate procurement, contracts, and invoices with SAP Ariba.",
  auth: sapAribaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/sap-ariba.png",
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.COMMERCE],
  authors: ['onyedikachi-david'],
  actions: [
    listPurchaseOrders,
    listPurchaseOrderItems,
    getDocumentChanges,
    getPendingApprovables,
    getCatalogItems,
    getActiveCatalogs,
    getFacetData,
    listInvoices,
    searchContractWorkspaces,
    getContractWorkspace,
    createContractWorkspace,
    updateContractWorkspace,
    updateContractStatus,
    deleteContractWorkspace,
  ],
  triggers: [],
});
