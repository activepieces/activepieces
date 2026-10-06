import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { moxieCreateClientAction } from './lib/actions/create-client';
import { moxieCreateContactAction } from './lib/actions/create-contact';
import { moxieCreateTaskAction } from './lib/actions/create-task';
import { moxieCreateProjectAction } from './lib/actions/create-project';
import { moxieListClientsAction } from './lib/actions/list-clients';
import { moxieSearchClientsAction } from './lib/actions/search-clients';
import { moxieSearchContactsAction } from './lib/actions/search-contacts';
import { moxieSearchProjectsAction } from './lib/actions/search-projects';
import { moxieListPipelineStagesAction } from './lib/actions/list-pipeline-stages';
import { moxieListWorkspaceUsersAction } from './lib/actions/list-workspace-users';
import { moxieListInvoiceTemplatesAction } from './lib/actions/list-invoice-templates';
import { moxieAddTicketCommentAction } from './lib/actions/add-ticket-comment';
import { moxieApplyPaymentAction } from './lib/actions/apply-payment';
import { moxieApproveTaskAction } from './lib/actions/approve-task';
import { moxieAttachFileFromUrlAction } from './lib/actions/attach-file-from-url';
import { moxieCreateExpenseAction } from './lib/actions/create-expense';
import { moxieCreateFormSubmissionAction } from './lib/actions/create-form-submission';
import { moxieCreateInvoiceAction } from './lib/actions/create-invoice';
import { moxieCreateOpportunityAction } from './lib/actions/create-opportunity';
import { moxieCreateOrUpdateCalendarEventAction } from './lib/actions/create-or-update-calendar-event';
import { moxieCreateTicketAction } from './lib/actions/create-ticket';
import { moxieCreateTimeEntryAction } from './lib/actions/create-time-entry';
import { moxieDeleteCalendarEventAction } from './lib/actions/delete-calendar-event';
import { moxieGetEmailTemplateAction } from './lib/actions/get-email-template';
import { moxieGetWorkspaceAccountAction } from './lib/actions/get-workspace-account';
import { moxieListEmailTemplatesAction } from './lib/actions/list-email-templates';
import { moxieListFormNamesAction } from './lib/actions/list-form-names';
import { moxieListProjectTypesAction } from './lib/actions/list-project-types';
import { moxieListTaskStagesAction } from './lib/actions/list-task-stages';
import { moxieListTasksAction } from './lib/actions/list-tasks';
import { moxieListTicketsAction } from './lib/actions/list-tickets';
import { moxieListVendorsAction } from './lib/actions/list-vendors';
import { moxieSearchAgreementsAction } from './lib/actions/search-agreements';
import { moxieSearchPayableInvoicesAction } from './lib/actions/search-payable-invoices';
import { moxieSearchTasksAction } from './lib/actions/search-tasks';
import { moxieSearchTicketsAction } from './lib/actions/search-tickets';
import { moxieUpdateClientAction } from './lib/actions/update-client';
import { moxieUpdateContactAction } from './lib/actions/update-contact';
import { moxieUpdateExpenseAction } from './lib/actions/update-expense';
import { moxieUpdateOpportunityAction } from './lib/actions/update-opportunity';
import { moxieUpdateProjectAction } from './lib/actions/update-project';
import { moxieUpdateTaskAction } from './lib/actions/update-task';
import { moxieUpdateTicketStatusAction } from './lib/actions/update-ticket-status';
import { moxieUploadAttachmentAction } from './lib/actions/upload-attachment';
import { moxieClientCreateAction } from './lib/actions/ai/client-create';
import { moxieClientUpdateAction } from './lib/actions/ai/client-update';
import { moxieContactCreateAction } from './lib/actions/ai/contact-create';
import { moxieContactUpdateAction } from './lib/actions/ai/contact-update';
import { moxieExpenseCreateAction } from './lib/actions/ai/expense-create';
import { moxieInvoiceCreateAction } from './lib/actions/ai/invoice-create';
import { moxieOpportunityCreateAction } from './lib/actions/ai/opportunity-create';
import { moxieOpportunityUpdateAction } from './lib/actions/ai/opportunity-update';
import { moxiePaymentCreateAction } from './lib/actions/ai/payment-create';
import { moxieProjectCreateAction } from './lib/actions/ai/project-create';
import { moxieProjectUpdateAction } from './lib/actions/ai/project-update';
import { moxieTaskCreateAction } from './lib/actions/ai/task-create';
import { moxieTaskUpdateAction } from './lib/actions/ai/task-update';
import { moxieTimeEntryCreateAction } from './lib/actions/ai/time-entry-create';
import { moxieCRMAuth } from './lib/auth';
import { assertMoxieRequestUrl, normalizeBaseUrl } from './lib/common/client';
import { moxieCRMTriggers } from './lib/triggers';

export const moxieCrm = createPiece({
  displayName: 'Moxie',
  description: 'CRM build for the freelancers.',
  auth: moxieCRMAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/moxie-crm.png',
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    moxieCreateClientAction,
    moxieCreateContactAction,
    moxieCreateTaskAction,
    moxieCreateProjectAction,
    moxieListClientsAction,
    moxieSearchClientsAction,
    moxieSearchContactsAction,
    moxieSearchProjectsAction,
    moxieListPipelineStagesAction,
    moxieListWorkspaceUsersAction,
    moxieListInvoiceTemplatesAction,
    moxieAddTicketCommentAction,
    moxieApplyPaymentAction,
    moxieApproveTaskAction,
    moxieAttachFileFromUrlAction,
    moxieCreateExpenseAction,
    moxieCreateFormSubmissionAction,
    moxieCreateInvoiceAction,
    moxieCreateOpportunityAction,
    moxieCreateOrUpdateCalendarEventAction,
    moxieCreateTicketAction,
    moxieCreateTimeEntryAction,
    moxieDeleteCalendarEventAction,
    moxieGetEmailTemplateAction,
    moxieGetWorkspaceAccountAction,
    moxieListEmailTemplatesAction,
    moxieListFormNamesAction,
    moxieListProjectTypesAction,
    moxieListTaskStagesAction,
    moxieListTasksAction,
    moxieListTicketsAction,
    moxieListVendorsAction,
    moxieSearchAgreementsAction,
    moxieSearchPayableInvoicesAction,
    moxieSearchTasksAction,
    moxieSearchTicketsAction,
    moxieUpdateClientAction,
    moxieUpdateContactAction,
    moxieUpdateExpenseAction,
    moxieUpdateOpportunityAction,
    moxieUpdateProjectAction,
    moxieUpdateTaskAction,
    moxieUpdateTicketStatusAction,
    moxieUploadAttachmentAction,
    moxieClientCreateAction,
    moxieClientUpdateAction,
    moxieContactCreateAction,
    moxieContactUpdateAction,
    moxieExpenseCreateAction,
    moxieInvoiceCreateAction,
    moxieOpportunityCreateAction,
    moxieOpportunityUpdateAction,
    moxiePaymentCreateAction,
    moxieProjectCreateAction,
    moxieProjectUpdateAction,
    moxieTaskCreateAction,
    moxieTaskUpdateAction,
    moxieTimeEntryCreateAction,
    createCustomApiCallAction({
      baseUrl: (auth) => customApiBaseUrl({ baseUrl: auth?.props.baseUrl }),
      auth: moxieCRMAuth,
      authMapping: async (auth, propsValue) => {
        assertMoxieRequestUrl({ baseUrl: auth.props.baseUrl, url: propsValue['url']?.['url'] });
        return { 'X-API-KEY': auth.props.apiKey.trim() };
      },
    }),
  ],
  triggers: moxieCRMTriggers,
});

function customApiBaseUrl({ baseUrl }: { baseUrl: string | undefined }): string {
  try {
    return normalizeBaseUrl({ baseUrl });
  } catch {
    return '';
  }
}
