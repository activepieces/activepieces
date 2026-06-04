import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

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
import { createOrder } from './lib/actions/create-order';
import { updateOrder } from './lib/actions/update-order';
import { getOrder } from './lib/actions/get-order';
import { listOrders } from './lib/actions/list-orders';
import { deleteOrder } from './lib/actions/delete-order';
import { sendToDatabin } from './lib/actions/send-to-databin';
import { addToList } from './lib/actions/add-to-list';

// Triggers
import { newContact } from './lib/triggers/new-contact';
import { newCompany } from './lib/triggers/new-company';
import { newDeal } from './lib/triggers/new-deal';
import { newTask } from './lib/triggers/new-task';
import { newOrUpdatedContact } from './lib/triggers/new-or-updated-contact';
import { newOrUpdatedCompany } from './lib/triggers/new-or-updated-company';
import { newOrUpdatedDeal } from './lib/triggers/new-or-updated-deal';
import { newOrUpdatedTask } from './lib/triggers/new-or-updated-task';

export const ninjapipeAuth = PieceAuth.CustomAuth({
  displayName: 'NinjaPipe API Connection',
  required: true,
  description: `Connect to your NinjaPipe workspace.

1. Log in to NinjaPipe and open **Workspace Settings > NinjaPipe API**.
2. Copy your **API key** (starts with \`np_\`).
3. Enter your workspace **API Base URL**. The default is \`https://www.ninjapipe.app/api\`.`,
  props: {
    base_url: Property.ShortText({
      displayName: 'API Base URL',
      description: 'Your workspace API base URL (e.g. https://www.ninjapipe.app/api).',
      required: true,
      defaultValue: 'https://www.ninjapipe.app/api',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your workspace API key from NinjaPipe Settings > API.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    let parsed: URL;
    try {
      parsed = new URL(auth.base_url);
    } catch {
      return { valid: false, error: 'Base URL is not a valid URL.' };
    }
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Base URL must use https://.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === '169.254.169.254' ||
      /^169\.254\./.test(host) ||
      /^fc00:/i.test(host) ||
      /^fe80:/i.test(host) ||
      host === '::1'
    ) {
      return { valid: false, error: `Base URL host "${host}" is not allowed (loopback, private, or metadata IP).` };
    }
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.base_url.replace(/\/+$/, '')}/contacts`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.api_key,
        },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      const err = e as { response?: { status?: number }; status?: number; message?: string };
      const status = err.response?.status ?? err.status;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'API key was rejected. Check the key in NinjaPipe Settings > API.' };
      }
      if (status === 404) {
        return { valid: false, error: 'Base URL is reachable but /contacts returned 404. Check the Base URL path.' };
      }
      return { valid: false, error: `Could not connect to NinjaPipe (${status ?? err.message ?? 'unknown error'}). Check the Base URL and API Key.` };
    }
  },
});

export const ninjapipe = createPiece({
  displayName: 'NinjaPipe',
  description: 'NinjaPipe CRM integration with contacts, companies, deals, tasks (under projects), pipelines, products, budgets, projects, orders, lists, and Databin webhook delivery.',
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
    createOrder,
    updateOrder,
    getOrder,
    listOrders,
    deleteOrder,
    sendToDatabin,
    addToList,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth?.props?.base_url as string) ?? '',
      auth: ninjapipeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth?.props?.api_key as string}`,
      }),
    }),
  ],
  triggers: [
    newContact,
    newCompany,
    newDeal,
    newTask,
    newOrUpdatedContact,
    newOrUpdatedCompany,
    newOrUpdatedDeal,
    newOrUpdatedTask,
  ],
});
