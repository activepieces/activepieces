import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import {
  housecallProAuth,
  baseUrl,
  // Customer actions
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  getCustomerAddresses,
  createCustomerAddress,
  getCustomerAddress,
  // Job actions
  createJob,
  getJobs,
  getJob,
  updateJobSchedule,
  deleteJobSchedule,
} from "./lib/common";

export const housecallPro = createPiece({
  displayName: "Housecall Pro",
  description: "Manage your home service business with Housecall Pro CRM integration",
  auth: housecallProAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/housecall-pro.png",
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["Activepieces"],
  actions: [
    // Customer actions
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    getCustomerAddresses,
    createCustomerAddress,
    getCustomerAddress,
    // Job actions
    createJob,
    getJobs,
    getJob,
    updateJobSchedule,
    deleteJobSchedule,
    // Custom API Call
    createCustomApiCallAction({
      baseUrl: () => baseUrl,
      auth: housecallProAuth,
      authMapping: async (auth) => ({
        "Authorization": `Token ${auth}`,
        "Content-Type": "application/json",
      }),
    }),
  ],
  triggers: [],
});