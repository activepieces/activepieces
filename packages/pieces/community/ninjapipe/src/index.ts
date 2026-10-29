import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from './lib/auth';
import { addContactNote } from './lib/actions/add-contact-note';
import { addToList } from './lib/actions/add-to-list';
import { createBudgetExpense } from './lib/actions/create-budget-expense';
import { createBudget } from './lib/actions/create-budget';
import { createCompany } from './lib/actions/create-company';
import { createContact } from './lib/actions/create-contact';
import { ninjapipeCustomApiCall } from './lib/actions/custom-api-call';
import { createDeal } from './lib/actions/create-deal';
import { createOrder } from './lib/actions/create-order';
import { createPipelineItem } from './lib/actions/create-pipeline-item';
import { createPipeline } from './lib/actions/create-pipeline';
import { createProduct } from './lib/actions/create-product';
import { createProject } from './lib/actions/create-project';
import { createTask } from './lib/actions/create-task';
import { deleteBudget } from './lib/actions/delete-budget';
import { deleteCompany } from './lib/actions/delete-company';
import { deleteContact } from './lib/actions/delete-contact';
import { deleteDeal } from './lib/actions/delete-deal';
import { deleteOrder } from './lib/actions/delete-order';
import { deletePipeline } from './lib/actions/delete-pipeline';
import { deleteProduct } from './lib/actions/delete-product';
import { deleteProject } from './lib/actions/delete-project';
import { deleteTask } from './lib/actions/delete-task';
import { getBudget } from './lib/actions/get-budget';
import { getCompany } from './lib/actions/get-company';
import { getContact } from './lib/actions/get-contact';
import { getDeal } from './lib/actions/get-deal';
import { getOrder } from './lib/actions/get-order';
import { getPipeline } from './lib/actions/get-pipeline';
import { getProduct } from './lib/actions/get-product';
import { getProject } from './lib/actions/get-project';
import { getTask } from './lib/actions/get-task';
import { listBudgets } from './lib/actions/list-budgets';
import { listCompanies } from './lib/actions/list-companies';
import { listContacts } from './lib/actions/list-contacts';
import { listDeals } from './lib/actions/list-deals';
import { listOrders } from './lib/actions/list-orders';
import { listPipelines } from './lib/actions/list-pipelines';
import { listProducts } from './lib/actions/list-products';
import { listProjects } from './lib/actions/list-projects';
import { listTasks } from './lib/actions/list-tasks';
import { sendToDatabin } from './lib/actions/send-to-databin';
import { toggleClientPortal } from './lib/actions/toggle-client-portal';
import { updateBudget } from './lib/actions/update-budget';
import { updateCompany } from './lib/actions/update-company';
import { updateContact } from './lib/actions/update-contact';
import { updateDeal } from './lib/actions/update-deal';
import { updateOrder } from './lib/actions/update-order';
import { updatePipelineItem } from './lib/actions/update-pipeline-item';
import { updatePipeline } from './lib/actions/update-pipeline';
import { updateProduct } from './lib/actions/update-product';
import { updateProject } from './lib/actions/update-project';
import { updateTask } from './lib/actions/update-task';
import { upsertContact } from './lib/actions/upsert-contact';
import { aiAddContactNote } from './lib/actions/ai/add-contact-note';
import { aiCreateCompany } from './lib/actions/ai/create-company';
import { aiCreateContact } from './lib/actions/ai/create-contact';
import { aiCreateDeal } from './lib/actions/ai/create-deal';
import { aiCreatePipelineItem } from './lib/actions/ai/create-pipeline-item';
import { aiCreateTask } from './lib/actions/ai/create-task';
import { aiGetCompany } from './lib/actions/ai/get-company';
import { aiGetContact } from './lib/actions/ai/get-contact';
import { aiGetDeal } from './lib/actions/ai/get-deal';
import { aiListContactActivities } from './lib/actions/ai/list-contact-activities';
import { aiListPipelineItems } from './lib/actions/ai/list-pipeline-items';
import { aiListPipelines } from './lib/actions/ai/list-pipelines';
import { aiListProjects } from './lib/actions/ai/list-projects';
import { aiListTasks } from './lib/actions/ai/list-tasks';
import { aiListWorkspaceMembers } from './lib/actions/ai/list-workspace-members';
import { aiSearchCompanies } from './lib/actions/ai/search-companies';
import { aiSearchContacts } from './lib/actions/ai/search-contacts';
import { aiSearchDeals } from './lib/actions/ai/search-deals';
import { aiUpdateCompany } from './lib/actions/ai/update-company';
import { aiUpdateContact } from './lib/actions/ai/update-contact';
import { aiUpdateDeal } from './lib/actions/ai/update-deal';
import { aiUpdatePipelineItem } from './lib/actions/ai/update-pipeline-item';
import { aiUpdateTask } from './lib/actions/ai/update-task';
import { newCompany } from './lib/triggers/new-company';
import { newContact } from './lib/triggers/new-contact';
import { newDeal } from './lib/triggers/new-deal';
import { newOrUpdatedCompany } from './lib/triggers/new-or-updated-company';
import { newOrUpdatedContact } from './lib/triggers/new-or-updated-contact';
import { newOrUpdatedDeal } from './lib/triggers/new-or-updated-deal';
import { newOrUpdatedTask } from './lib/triggers/new-or-updated-task';
import { newTask } from './lib/triggers/new-task';

export const ninjapipe = createPiece({
  displayName: 'NinjaPipe',
  description: 'NinjaPipe CRM integration with contacts, companies, deals, tasks (under projects), pipelines and pipeline items, products, budgets, projects, orders, lists, and Databin webhook delivery.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/ninjapipe.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: ninjapipeAuth,
  authors: ['hemmilicious', 'OdaiAhmed99'],
  actions: [
    addContactNote,
    addToList,
    createBudgetExpense,
    createBudget,
    createCompany,
    createContact,
    createDeal,
    createOrder,
    createPipelineItem,
    createPipeline,
    createProduct,
    createProject,
    createTask,
    deleteBudget,
    deleteCompany,
    deleteContact,
    deleteDeal,
    deleteOrder,
    deletePipeline,
    deleteProduct,
    deleteProject,
    deleteTask,
    getBudget,
    getCompany,
    getContact,
    getDeal,
    getOrder,
    getPipeline,
    getProduct,
    getProject,
    getTask,
    listBudgets,
    listCompanies,
    listContacts,
    listDeals,
    listOrders,
    listPipelines,
    listProducts,
    listProjects,
    listTasks,
    sendToDatabin,
    toggleClientPortal,
    updateBudget,
    updateCompany,
    updateContact,
    updateDeal,
    updateOrder,
    updatePipelineItem,
    updatePipeline,
    updateProduct,
    updateProject,
    updateTask,
    upsertContact,
    aiAddContactNote,
    aiCreateCompany,
    aiCreateContact,
    aiCreateDeal,
    aiCreatePipelineItem,
    aiCreateTask,
    aiGetCompany,
    aiGetContact,
    aiGetDeal,
    aiListContactActivities,
    aiListPipelineItems,
    aiListPipelines,
    aiListProjects,
    aiListTasks,
    aiListWorkspaceMembers,
    aiSearchCompanies,
    aiSearchContacts,
    aiSearchDeals,
    aiUpdateCompany,
    aiUpdateContact,
    aiUpdateDeal,
    aiUpdatePipelineItem,
    aiUpdateTask,
    ninjapipeCustomApiCall,
  ],
  triggers: [
    newCompany,
    newContact,
    newDeal,
    newOrUpdatedCompany,
    newOrUpdatedContact,
    newOrUpdatedDeal,
    newOrUpdatedTask,
    newTask,
  ],
});

export { ninjapipeAuth };
