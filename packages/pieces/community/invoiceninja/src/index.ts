import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { actionRecurringInvoice } from './lib/actions/action-recurring';
import { archiveClient, deleteClient, findClients, getClientAi, restoreClient, updateClient } from './lib/actions/ai/clients';
import { createCredit, createProduct, getCredit, getProduct, listCredits, listProducts, updateProduct } from './lib/actions/ai/credits-products';
import { createExpense, createProject, createVendor, getExpense, getProject, getVendor, listExpenses, listProjects, listVendors } from './lib/actions/ai/expenses-projects-vendors';
import { archiveInvoice, createInvoiceAi, deleteInvoice, emailInvoice, getInvoice, listInvoices, markInvoicePaid, markInvoiceSent, restoreInvoice, updateInvoice } from './lib/actions/ai/invoices';
import { createPayment, deletePayment, getPayment, listPayments, refundPayment } from './lib/actions/ai/payments';
import { approveQuote, convertQuoteToInvoice, createQuote, deleteQuote, emailQuote, getQuote, listQuotes, updateQuote } from './lib/actions/ai/quotes';
import { createRecurringInvoiceAi, deleteRecurringInvoice, getRecurringInvoice, listRecurringInvoices, sendRecurringInvoiceNow, startRecurringInvoice, stopRecurringInvoice } from './lib/actions/ai/recurring-invoices';
import { createTaskAi, getTask, listTasks, runReport, startTask, stopTask, updateTask } from './lib/actions/ai/tasks-reports';
import { createClient } from './lib/actions/create-client';
import { createInvoice } from './lib/actions/create-invoice';
import { createRecurringInvoice } from './lib/actions/create-recurring';
import { createTask } from './lib/actions/create-task';
import { getClient } from './lib/actions/get-client';
import { getInvoices } from './lib/actions/get-invoices';
import { getReport } from './lib/actions/get-report';
import { existsTask } from './lib/actions/task-exists';
import { invoiceninjaAuth } from './lib/common/auth';
import { invoiceNinjaClient } from './lib/common/client';

export const invoiceninja = createPiece({
  displayName: 'Invoice Ninja',
  description: 'Free open-source invoicing tool',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/invoiceninja.png',
  categories: [PieceCategory.ACCOUNTING],
  authors: ['buttonsbond', 'kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'khaledmashaly', 'abuaboud'],
  auth: invoiceninjaAuth,
  actions: [
    createTask,
    existsTask,
    getClient,
    getInvoices,
    getReport,
    createInvoice,
    createClient,
    createRecurringInvoice,
    actionRecurringInvoice,
    getClientAi,
    findClients,
    updateClient,
    archiveClient,
    restoreClient,
    deleteClient,
    getInvoice,
    listInvoices,
    createInvoiceAi,
    updateInvoice,
    emailInvoice,
    markInvoiceSent,
    markInvoicePaid,
    archiveInvoice,
    restoreInvoice,
    deleteInvoice,
    getQuote,
    listQuotes,
    createQuote,
    updateQuote,
    emailQuote,
    approveQuote,
    convertQuoteToInvoice,
    deleteQuote,
    getRecurringInvoice,
    listRecurringInvoices,
    createRecurringInvoiceAi,
    startRecurringInvoice,
    stopRecurringInvoice,
    sendRecurringInvoiceNow,
    deleteRecurringInvoice,
    getPayment,
    listPayments,
    createPayment,
    refundPayment,
    deletePayment,
    getCredit,
    listCredits,
    createCredit,
    getProduct,
    listProducts,
    createProduct,
    updateProduct,
    getExpense,
    listExpenses,
    createExpense,
    getTask,
    listTasks,
    createTaskAi,
    updateTask,
    startTask,
    stopTask,
    getProject,
    listProjects,
    createProject,
    getVendor,
    listVendors,
    createVendor,
    runReport,
    createCustomApiCallAction({
      auth: invoiceninjaAuth,
      baseUrl: (auth) => (auth ? invoiceNinjaClient.apiBaseUrl(auth.props.base_url) : ''),
      authMapping: async (auth, propsValue) => {
        const baseUrl = invoiceNinjaClient.apiBaseUrl(auth.props.base_url);
        const urlProp = propsValue['url'];
        const url = invoiceNinjaClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          if (!invoiceNinjaClient.isSameOrigin({ url, baseUrl })) {
            throw new Error('The URL must be on the Invoice Ninja Base URL of the connection.');
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase().includes('%2e'))) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return invoiceNinjaClient.authHeaders(auth.props);
      },
    }),
  ],
  triggers: [],
});

export { invoiceninjaAuth };
