import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

// Actions
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { getContact } from './lib/actions/get-contact';
import { listContacts } from './lib/actions/list-contacts';
import { deleteContact } from './lib/actions/delete-contact';
import { upsertContact } from './lib/actions/upsert-contact';
import { toggleClientPortal } from './lib/actions/toggle-client-portal';
import { createCompany } from './lib/actions/create-company';
import { updateCompany } from './lib/actions/update-company';
import { getCompany } from './lib/actions/get-company';
import { listCompanies } from './lib/actions/list-companies';
import { deleteCompany } from './lib/actions/delete-company';
import { createDeal } from './lib/actions/create-deal';
import { updateDeal } from './lib/actions/update-deal';
import { getDeal } from './lib/actions/get-deal';
import { listDeals } from './lib/actions/list-deals';
import { deleteDeal } from './lib/actions/delete-deal';
import { createProduct } from './lib/actions/create-product';
import { updateProduct } from './lib/actions/update-product';
import { getProduct } from './lib/actions/get-product';
import { listProducts } from './lib/actions/list-products';
import { deleteProduct } from './lib/actions/delete-product';
import { createBudget } from './lib/actions/create-budget';
import { updateBudget } from './lib/actions/update-budget';
import { getBudget } from './lib/actions/get-budget';
import { listBudgets } from './lib/actions/list-budgets';
import { deleteBudget } from './lib/actions/delete-budget';
import { createBudgetExpense } from './lib/actions/create-budget-expense';
import { createProject } from './lib/actions/create-project';
import { updateProject } from './lib/actions/update-project';
import { getProject } from './lib/actions/get-project';
import { listProjects } from './lib/actions/list-projects';
import { deleteProject } from './lib/actions/delete-project';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { getTask } from './lib/actions/get-task';
import { listTasks } from './lib/actions/list-tasks';
import { deleteTask } from './lib/actions/delete-task';
import { createPipeline } from './lib/actions/create-pipeline';
import { updatePipeline } from './lib/actions/update-pipeline';
import { getPipeline } from './lib/actions/get-pipeline';
import { listPipelines } from './lib/actions/list-pipelines';
import { deletePipeline } from './lib/actions/delete-pipeline';
import { createPipelineItem } from './lib/actions/create-pipeline-item';
import { updatePipelineItem } from './lib/actions/update-pipeline-item';
import { getPipelineItem } from './lib/actions/get-pipeline-item';
import { listPipelineItems } from './lib/actions/list-pipeline-items';
import { deletePipelineItem } from './lib/actions/delete-pipeline-item';
import { createInvoice } from './lib/actions/create-invoice';
import { updateInvoice } from './lib/actions/update-invoice';
import { getInvoice } from './lib/actions/get-invoice';
import { listInvoices } from './lib/actions/list-invoices';
import { deleteInvoice } from './lib/actions/delete-invoice';
import { createOrder } from './lib/actions/create-order';
import { updateOrder } from './lib/actions/update-order';
import { getOrder } from './lib/actions/get-order';
import { listOrders } from './lib/actions/list-orders';
import { deleteOrder } from './lib/actions/delete-order';
import { sendToDatabin } from './lib/actions/send-to-databin';
import { customApiCall } from './lib/actions/custom-api-call';

// Triggers
import { newContact } from './lib/triggers/new-contact';
import { newCompany } from './lib/triggers/new-company';
import { newDeal } from './lib/triggers/new-deal';
import { newTask } from './lib/triggers/new-task';
import { newDatabinReceived } from './lib/triggers/new-databin-received';
import { newOrUpdatedContact } from './lib/triggers/new-or-updated-contact';
import { newOrUpdatedCompany } from './lib/triggers/new-or-updated-company';
import { newOrUpdatedDeal } from './lib/triggers/new-or-updated-deal';
import { newOrUpdatedTask } from './lib/triggers/new-or-updated-task';
import { ninjapipeAuth } from './lib/auth';

export { ninjapipeAuth };

export const ninjapipe = createPiece({
  displayName: 'NinjaPipe',
  description: 'NinjaPipe CRM integration with contacts, companies, deals, tasks, pipelines, invoices, and databins.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ninjapipe.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: ninjapipeAuth,
  authors: ['hemmilicious'],
  actions: [
    createContact,
    updateContact,
    getContact,
    listContacts,
    deleteContact,
    upsertContact,
    toggleClientPortal,
    createCompany,
    updateCompany,
    getCompany,
    listCompanies,
    deleteCompany,
    createDeal,
    updateDeal,
    getDeal,
    listDeals,
    deleteDeal,
    createProduct,
    updateProduct,
    getProduct,
    listProducts,
    deleteProduct,
    createBudget,
    updateBudget,
    getBudget,
    listBudgets,
    deleteBudget,
    createBudgetExpense,
    createProject,
    updateProject,
    getProject,
    listProjects,
    deleteProject,
    createTask,
    updateTask,
    getTask,
    listTasks,
    deleteTask,
    createPipeline,
    updatePipeline,
    getPipeline,
    listPipelines,
    deletePipeline,
    createPipelineItem,
    updatePipelineItem,
    getPipelineItem,
    listPipelineItems,
    deletePipelineItem,
    createInvoice,
    updateInvoice,
    getInvoice,
    listInvoices,
    deleteInvoice,
    createOrder,
    updateOrder,
    getOrder,
    listOrders,
    deleteOrder,
    sendToDatabin,
    customApiCall,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as unknown as { base_url: string }).base_url,
      auth: ninjapipeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as unknown as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [
    newContact,
    newCompany,
    newDeal,
    newTask,
    newDatabinReceived,
    newOrUpdatedContact,
    newOrUpdatedCompany,
    newOrUpdatedDeal,
    newOrUpdatedTask,
  ],
});
