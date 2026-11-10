import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { BASE, fail, lastRequest, loadOptions, ok, request, runAction, sendRequest } from './helpers';
import { moxieCrm } from '../src';
import { moxieClientCreateAction } from '../src/lib/actions/ai/client-create';
import { moxieClientUpdateAction } from '../src/lib/actions/ai/client-update';
import { moxieContactCreateAction } from '../src/lib/actions/ai/contact-create';
import { moxieContactUpdateAction } from '../src/lib/actions/ai/contact-update';
import { moxieExpenseCreateAction } from '../src/lib/actions/ai/expense-create';
import { moxieInvoiceCreateAction } from '../src/lib/actions/ai/invoice-create';
import { moxieOpportunityCreateAction } from '../src/lib/actions/ai/opportunity-create';
import { moxieOpportunityUpdateAction } from '../src/lib/actions/ai/opportunity-update';
import { moxiePaymentCreateAction } from '../src/lib/actions/ai/payment-create';
import { moxieProjectCreateAction } from '../src/lib/actions/ai/project-create';
import { moxieProjectUpdateAction } from '../src/lib/actions/ai/project-update';
import { moxieTaskCreateAction } from '../src/lib/actions/ai/task-create';
import { moxieTaskUpdateAction } from '../src/lib/actions/ai/task-update';
import { moxieTimeEntryCreateAction } from '../src/lib/actions/ai/time-entry-create';
import { moxieAddTicketCommentAction } from '../src/lib/actions/add-ticket-comment';
import { moxieApplyPaymentAction } from '../src/lib/actions/apply-payment';
import { moxieApproveTaskAction } from '../src/lib/actions/approve-task';
import { moxieAttachFileFromUrlAction } from '../src/lib/actions/attach-file-from-url';
import { moxieCreateExpenseAction } from '../src/lib/actions/create-expense';
import { moxieCreateFormSubmissionAction } from '../src/lib/actions/create-form-submission';
import { moxieCreateInvoiceAction } from '../src/lib/actions/create-invoice';
import { moxieCreateOpportunityAction } from '../src/lib/actions/create-opportunity';
import { moxieCreateOrUpdateCalendarEventAction } from '../src/lib/actions/create-or-update-calendar-event';
import { moxieCreateProjectAction } from '../src/lib/actions/create-project';
import { moxieCreateTaskAction } from '../src/lib/actions/create-task';
import { moxieCreateTicketAction } from '../src/lib/actions/create-ticket';
import { moxieCreateTimeEntryAction } from '../src/lib/actions/create-time-entry';
import { moxieDeleteCalendarEventAction } from '../src/lib/actions/delete-calendar-event';
import { moxieGetEmailTemplateAction } from '../src/lib/actions/get-email-template';
import { moxieGetWorkspaceAccountAction } from '../src/lib/actions/get-workspace-account';
import { moxieListEmailTemplatesAction } from '../src/lib/actions/list-email-templates';
import { moxieListFormNamesAction } from '../src/lib/actions/list-form-names';
import { moxieListProjectTypesAction } from '../src/lib/actions/list-project-types';
import { moxieListTaskStagesAction } from '../src/lib/actions/list-task-stages';
import { moxieListTasksAction } from '../src/lib/actions/list-tasks';
import { moxieListTicketsAction } from '../src/lib/actions/list-tickets';
import { moxieListVendorsAction } from '../src/lib/actions/list-vendors';
import { moxieSearchAgreementsAction } from '../src/lib/actions/search-agreements';
import { moxieSearchClientsAction } from '../src/lib/actions/search-clients';
import { moxieSearchContactsAction } from '../src/lib/actions/search-contacts';
import { moxieSearchPayableInvoicesAction } from '../src/lib/actions/search-payable-invoices';
import { moxieSearchProjectsAction } from '../src/lib/actions/search-projects';
import { moxieSearchTasksAction } from '../src/lib/actions/search-tasks';
import { moxieSearchTicketsAction } from '../src/lib/actions/search-tickets';
import { moxieUpdateClientAction } from '../src/lib/actions/update-client';
import { moxieUpdateContactAction } from '../src/lib/actions/update-contact';
import { moxieUpdateExpenseAction } from '../src/lib/actions/update-expense';
import { moxieUpdateOpportunityAction } from '../src/lib/actions/update-opportunity';
import { moxieUpdateProjectAction } from '../src/lib/actions/update-project';
import { moxieUpdateTaskAction } from '../src/lib/actions/update-task';
import { moxieUpdateTicketStatusAction } from '../src/lib/actions/update-ticket-status';
import { moxieUploadAttachmentAction } from '../src/lib/actions/upload-attachment';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: {} });
});

describe('piece metadata', () => {
  const actions = Object.values(moxieCrm.actions());
  const handWritten = actions.filter((a) => a.name !== 'custom_api_call');

  test('58 hand-written actions: 14 ai atomics, 11 human, 33 both, plus the custom API call', () => {
    expect(handWritten).toHaveLength(58);
    expect(handWritten.filter((a) => a.audience === 'ai')).toHaveLength(14);
    expect(handWritten.filter((a) => a.audience === 'human')).toHaveLength(11);
    expect(handWritten.filter((a) => a.audience === 'both')).toHaveLength(33);
  });

  test('every hand-written action has classification and aiMetadata, and every new one an outputSchema', () => {
    for (const action of handWritten) {
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
      if (action.name !== 'moxie_list_invoice_templates') {
        expect(action.outputSchema, action.name).toBeDefined();
      }
    }
  });

  test('the four twinned originals are not demoted before Tier-2', () => {
    const audience = Object.fromEntries(handWritten.map((a) => [a.name, a.audience]));
    for (const name of ['moxie_create_client', 'moxie_create_contact', 'moxie_create_project', 'moxie_create_task']) {
      expect(audience[name], name).toBe('both');
    }
  });

  test('only Delete Calendar Event is destructive', () => {
    expect(handWritten.filter((a) => a.classification === 'DESTRUCTIVE').map((a) => a.name)).toEqual([
      'moxie_delete_calendar_event',
    ]);
  });

  test('fixed defaults: portal access matches its option, task status has no invented default', () => {
    expect(moxieCreateProjectAction.props.portalAccess.defaultValue).toBe('Read only');
    expect(moxieCreateTaskAction.props.status.defaultValue).toBeUndefined();
  });

  test('the release floor is 0.88.2', () => {
    expect(moxieCrm.minimumSupportedRelease).toBe('0.88.2');
  });
});

const requestCases: Case[] = [
  {
    name: 'client create sends only set fields',
    action: moxieClientCreateAction,
    props: { name: ' Acme ', clientType: 'prospect', hourlyAmount: '90', archive: 'no', city: '' },
    method: HttpMethod.POST,
    path: '/action/clients/create',
    body: { name: 'Acme', clientType: 'Prospect', hourlyAmount: 90, archive: false },
  },
  {
    name: 'client update patches by id with clears',
    action: moxieClientUpdateAction,
    props: { clientId: 'c1', phone: '+1555', clearFields: ['notes'] },
    method: HttpMethod.PATCH,
    path: '/action/clients/update',
    body: { id: 'c1', phone: '+1555', notes: '' },
  },
  {
    name: 'human client update uses the same body',
    action: moxieUpdateClientAction,
    props: { clientId: 'c1', archive: 'yes' },
    method: HttpMethod.PATCH,
    path: '/action/clients/update',
    body: { id: 'c1', archive: true },
  },
  {
    name: 'contact create uses first/last keys',
    action: moxieContactCreateAction,
    props: { first: 'Ada', last: 'Chen', email: 'ada@example.com', clientName: 'Acme', portalAccess: 'yes' },
    method: HttpMethod.POST,
    path: '/action/contacts/create',
    body: { first: 'Ada', last: 'Chen', email: 'ada@example.com', clientName: 'Acme', portalAccess: true },
  },
  {
    name: 'contact update uses firstName/lastName keys and can move the client',
    action: moxieContactUpdateAction,
    props: { contactId: 'k1', firstName: 'Ada', clientId: 'c2', invoiceContact: 'no' },
    method: HttpMethod.PATCH,
    path: '/action/contacts/update',
    body: { id: 'k1', firstName: 'Ada', invoiceContact: false, clientId: 'c2' },
  },
  {
    name: 'human contact update',
    action: moxieUpdateContactAction,
    props: { contactId: 'k1', role: 'CEO' },
    method: HttpMethod.PATCH,
    path: '/action/contacts/update',
    body: { id: 'k1', role: 'CEO' },
  },
  {
    name: 'project create without a fee type sends no fee schedule',
    action: moxieProjectCreateAction,
    props: { name: 'Site', clientName: 'Acme', startDate: '2026-10-01', portalAccess: 'read only', templateName: 'Web' },
    method: HttpMethod.POST,
    path: '/action/projects/create',
    body: { name: 'Site', clientName: 'Acme', startDate: '2026-10-01', portalAccess: 'Read only', templateName: 'Web' },
  },
  {
    name: 'project create with a fee type nests the fee schedule',
    action: moxieProjectCreateAction,
    props: { name: 'Site', clientName: 'Acme', feeType: 'Hourly', amount: 120, taxable: 'yes' },
    method: HttpMethod.POST,
    path: '/action/projects/create',
    body: { name: 'Site', clientName: 'Acme', feeSchedule: { feeType: 'Hourly', amount: 120, taxable: true } },
  },
  {
    name: 'project update',
    action: moxieProjectUpdateAction,
    props: { projectId: 'p1', dueDate: '2026-12-31', active: 'no' },
    method: HttpMethod.PATCH,
    path: '/action/projects/update',
    body: { id: 'p1', dueDate: '2026-12-31', active: false },
  },
  {
    name: 'human project update takes the date part of a DateTime',
    action: moxieUpdateProjectAction,
    props: { clientName: 'Acme', projectId: 'p1', startDate: '2026-10-01T00:00:00.000Z' },
    method: HttpMethod.PATCH,
    path: '/action/projects/update',
    body: { id: 'p1', startDate: '2026-10-01' },
  },
  {
    name: 'task create sends names, subtasks and assignees, no default stage',
    action: moxieTaskCreateAction,
    props: { name: 'Wireframes', clientName: 'Acme', projectName: 'Site', tasks: ['a', ''], assignedTo: ['x@y.co'] },
    method: HttpMethod.POST,
    path: '/action/tasks/create',
    body: { name: 'Wireframes', clientName: 'Acme', projectName: 'Site', tasks: ['a'], assignedTo: ['x@y.co'] },
  },
  {
    name: 'task update moves the stage and replaces assignees',
    action: moxieTaskUpdateAction,
    props: { taskId: 't1', statusId: 's2', assignedToList: ['7', 8], clearFields: ['description'] },
    method: HttpMethod.PATCH,
    path: '/action/tasks/update',
    body: { id: 't1', statusId: 's2', assignedToList: [7, 8], description: '' },
  },
  {
    name: 'human task update',
    action: moxieUpdateTaskAction,
    props: { clientName: 'Acme', projectId: 'p1', taskId: 't1', priority: 3 },
    method: HttpMethod.PATCH,
    path: '/action/tasks/update',
    body: { id: 't1', priority: 3 },
  },
  {
    name: 'opportunity create',
    action: moxieOpportunityCreateAction,
    props: { name: 'Redesign', clientName: 'Acme', stageName: 'Qualified', value: 5000, estCloseDate: '2026-11-01' },
    method: HttpMethod.POST,
    path: '/action/opportunities/create',
    body: { name: 'Redesign', clientName: 'Acme', stageName: 'Qualified', value: 5000, estCloseDate: '2026-11-01' },
  },
  {
    name: 'human opportunity create',
    action: moxieCreateOpportunityAction,
    props: { name: 'Redesign', stageName: 'New' },
    method: HttpMethod.POST,
    path: '/action/opportunities/create',
    body: { name: 'Redesign', stageName: 'New' },
  },
  {
    name: 'opportunity update moves the stage',
    action: moxieOpportunityUpdateAction,
    props: { opportunityId: 'o1', statusId: 'st3', sentiment: 4, archive: 'yes' },
    method: HttpMethod.PATCH,
    path: '/action/opportunities/update',
    body: { id: 'o1', statusId: 'st3', sentiment: 4, archive: true },
  },
  {
    name: 'human opportunity update',
    action: moxieUpdateOpportunityAction,
    props: { opportunityId: 'o1', clientId: 'c1' },
    method: HttpMethod.PATCH,
    path: '/action/opportunities/update',
    body: { id: 'o1', clientId: 'c1' },
  },
  {
    name: 'invoice create stays a draft by default',
    action: moxieInvoiceCreateAction,
    props: { clientName: 'Acme', items: [{ description: 'Design', quantity: 2, rate: '50', taxable: true }], taxRate: 10 },
    method: HttpMethod.POST,
    path: '/action/invoices/create',
    body: { clientName: 'Acme', items: [{ description: 'Design', quantity: 2, rate: 50, taxable: true }], taxRate: 10 },
  },
  {
    name: 'invoice create with send builds sendTo',
    action: moxieCreateInvoiceAction,
    props: {
      clientName: 'Acme',
      templateName: 'Default',
      items: [{ description: 'Design', quantity: 1, rate: 100 }],
      send: true,
      sendToContacts: ['ada@example.com'],
      emailTemplateName: 'Invoice',
    },
    method: HttpMethod.POST,
    path: '/action/invoices/create',
    body: {
      clientName: 'Acme',
      items: [{ description: 'Design', quantity: 1, rate: 100 }],
      templateName: 'Default',
      sendTo: { send: true, contacts: ['ada@example.com'], emailTemplateName: 'Invoice' },
    },
  },
  {
    name: 'time entry create normalises timestamps and only sends true create flags',
    action: moxieTimeEntryCreateAction,
    props: {
      timerStart: '2026-10-01T09:00:00Z',
      timerEnd: '2026-10-01T10:30:00Z',
      clientName: 'Acme',
      createProject: true,
      createClient: false,
    },
    method: HttpMethod.POST,
    path: '/action/timeWorked/create',
    body: {
      timerStart: '2026-10-01T09:00:00.000Z',
      timerEnd: '2026-10-01T10:30:00.000Z',
      clientName: 'Acme',
      createProject: true,
    },
  },
  {
    name: 'human time entry create',
    action: moxieCreateTimeEntryAction,
    props: { timerStart: '2026-10-01T09:00:00.000Z', timerEnd: '2026-10-01T09:15:00.000Z', userEmail: 'me@x.co' },
    method: HttpMethod.POST,
    path: '/action/timeWorked/create',
    body: { timerStart: '2026-10-01T09:00:00.000Z', timerEnd: '2026-10-01T09:15:00.000Z', userEmail: 'me@x.co' },
  },
  {
    name: 'expense create',
    action: moxieExpenseCreateAction,
    props: { amount: 42.5, vendor: 'Adobe', paid: 'yes', markupPercentage: 10 },
    method: HttpMethod.POST,
    path: '/action/expenses/create',
    body: { amount: 42.5, vendor: 'Adobe', paid: true, markupPercentage: 10 },
  },
  {
    name: 'human expense create',
    action: moxieCreateExpenseAction,
    props: { amount: 10, clientName: 'Acme', reimbursable: 'yes' },
    method: HttpMethod.POST,
    path: '/action/expenses/create',
    body: { amount: 10, markupPercentage: 0, clientName: 'Acme', reimbursable: true },
  },
  {
    name: 'expense update uses Expense keys',
    action: moxieUpdateExpenseAction,
    props: { expenseId: 'e1', markupPercent: 5, paidDate: '2026-10-02', clearFields: ['billNo'] },
    method: HttpMethod.PATCH,
    path: '/action/expenses/update',
    body: { id: 'e1', markupPercent: 5, paidDate: '2026-10-02', billNo: '' },
  },
  {
    name: 'search tasks by query',
    action: moxieSearchTasksAction,
    props: { query: 'logo' },
    method: HttpMethod.GET,
    path: '/action/tasks/search',
    query: { query: 'logo' },
  },
  {
    name: 'search tasks by id ignores the query',
    action: moxieSearchTasksAction,
    props: { query: 'logo', id: 't1' },
    method: HttpMethod.GET,
    path: '/action/tasks/search',
    query: { id: 't1' },
  },
  {
    name: 'list tasks with filters',
    action: moxieListTasksAction,
    props: { projectId: 'p1', archived: 'no' },
    method: HttpMethod.GET,
    path: '/action/tasks/list',
    query: { projectId: 'p1', archived: 'false' },
  },
  {
    name: 'approve task maps the task name to deliverableName',
    action: moxieApproveTaskAction,
    props: { clientName: 'Acme', projectName: 'Site', taskName: 'Logo' },
    method: HttpMethod.POST,
    path: '/action/deliverable/approve',
    body: { clientName: 'Acme', projectName: 'Site', deliverableName: 'Logo' },
  },
  {
    name: 'search payable invoices by client',
    action: moxieSearchPayableInvoicesAction,
    props: { clientName: 'Acme' },
    method: HttpMethod.GET,
    path: '/action/payableInvoices/search',
    query: { query: 'Acme' },
  },
  {
    name: 'form submission with answers',
    action: moxieCreateFormSubmissionAction,
    props: { formName: 'Intake', email: 'lead@x.co', answers: [{ question: 'Budget?', answer: '5k' }] },
    method: HttpMethod.POST,
    path: '/action/formSubmissions/create',
    body: { formName: 'Intake', email: 'lead@x.co', answers: [{ question: 'Budget?', answer: '5k' }] },
  },
  {
    name: 'create ticket',
    action: moxieCreateTicketAction,
    props: { subject: 'Bug', comment: 'Broken', userEmail: 'c@x.co', ticketType: 'Support', dueDate: '2026-10-05' },
    method: HttpMethod.POST,
    path: '/action/tickets/create',
    body: { subject: 'Bug', comment: 'Broken', userEmail: 'c@x.co', ticketType: 'Support', dueDate: '2026-10-05' },
  },
  {
    name: 'add ticket comment uses privateComment',
    action: moxieAddTicketCommentAction,
    props: { ticketNumber: 1001, comment: 'On it', userEmail: 'me@x.co', privateComment: true },
    method: HttpMethod.POST,
    path: '/action/tickets/comments/create',
    body: { ticketNumber: 1001, comment: 'On it', userEmail: 'me@x.co', privateComment: true },
  },
  {
    name: 'update ticket status by number',
    action: moxieUpdateTicketStatusAction,
    props: { ticketNumber: 1001, status: 'Closed' },
    method: HttpMethod.PATCH,
    path: '/action/tickets/status',
    body: { ticketNumber: 1001, status: 'Closed' },
  },
  {
    name: 'search tickets by number',
    action: moxieSearchTicketsAction,
    props: { ticketNumber: 1001 },
    method: HttpMethod.GET,
    path: '/action/tickets/search',
    query: { ticketNumber: '1001' },
  },
  {
    name: 'list tickets open only',
    action: moxieListTicketsAction,
    props: { open: 'yes' },
    method: HttpMethod.GET,
    path: '/action/tickets/list',
    query: { open: 'true' },
  },
  {
    name: 'attach from URL sends query params only',
    action: moxieAttachFileFromUrlAction,
    props: { objectType: 'CLIENT', objectId: 'c1', fileUrl: 'https://cdn.example.com/a.pdf', fileName: 'a.pdf' },
    method: HttpMethod.POST,
    path: '/action/attachments/createFromUrl',
    query: { id: 'c1', type: 'CLIENT', fileUrl: 'https://cdn.example.com/a.pdf', fileName: 'a.pdf' },
  },
  {
    name: 'calendar event create maps to startTime/endTime',
    action: moxieCreateOrUpdateCalendarEventAction,
    props: { startTime: '2026-10-01T09:00:00Z', endTime: '2026-10-01T10:00:00Z', summary: 'Kickoff', busy: 'yes' },
    method: HttpMethod.POST,
    path: '/action/calendar/createOrUpdate',
    body: {
      startTime: '2026-10-01T09:00:00.000Z',
      endTime: '2026-10-01T10:00:00.000Z',
      busy: true,
      summary: 'Kickoff',
    },
  },
  {
    name: 'calendar event update by id',
    action: moxieCreateOrUpdateCalendarEventAction,
    props: { eventId: 'ev1', location: 'Zoom' },
    method: HttpMethod.POST,
    path: '/action/calendar/createOrUpdate',
    body: { eventId: 'ev1', location: 'Zoom' },
  },
  {
    name: 'search agreements by client',
    action: moxieSearchAgreementsAction,
    props: { clientId: 'c1' },
    method: HttpMethod.GET,
    path: '/action/agreements/search',
    query: { clientId: 'c1' },
  },
  {
    name: 'list task stages for a project type',
    action: moxieListTaskStagesAction,
    props: { projectTypeId: 'pt1' },
    method: HttpMethod.GET,
    path: '/action/taskStages/list',
    query: { projectTypeId: 'pt1' },
  },
  { name: 'list project types', action: moxieListProjectTypesAction, props: {}, method: HttpMethod.GET, path: '/action/projectTypes/list' },
  { name: 'list email templates', action: moxieListEmailTemplatesAction, props: {}, method: HttpMethod.GET, path: '/action/emailTemplates' },
  {
    name: 'get email template encodes the id',
    action: moxieGetEmailTemplateAction,
    props: { templateId: 'tpl-1' },
    method: HttpMethod.GET,
    path: '/action/emailTemplates/tpl-1',
  },
  {
    name: 'search clients by id',
    action: moxieSearchClientsAction,
    props: { id: 'c1' },
    method: HttpMethod.GET,
    path: '/action/clients/search',
    query: { id: 'c1' },
  },
  {
    name: 'search contacts by id',
    action: moxieSearchContactsAction,
    props: { id: 'k1' },
    method: HttpMethod.GET,
    path: '/action/contacts/search',
    query: { id: 'k1' },
  },
  {
    name: 'search projects with no input lists all projects',
    action: moxieSearchProjectsAction,
    props: {},
    method: HttpMethod.GET,
    path: '/action/projects/search',
  },
];

describe('outgoing requests', () => {
  test.each(requestCases)('$name', async ({ action, props, method, path, body, query }) => {
    await runAction({ action, props });
    const sent = lastRequest();
    expect(sent['method']).toBe(method);
    expect(sent['url']).toBe(`${BASE}${path}`);
    if (body === undefined) {
      expect(sent['body']).toBeUndefined();
    } else {
      expect(sent['body']).toEqual(body);
    }
    expect(sent['queryParams']).toEqual(query);
  });

  test('legacy create project keeps its fee schedule and adds template only when set', async () => {
    await runAction({
      action: moxieCreateProjectAction,
      props: { name: 'Site', clientName: 'Acme', portalAccess: 'Read only', feeType: 'Hourly', amount: 0, templateName: 'Web' },
    });
    expect(lastRequest()['body']).toEqual({
      name: 'Site',
      clientName: 'Acme',
      portalAccess: 'Read only',
      feeSchedule: { feeType: 'Hourly', amount: 0 },
      templateName: 'Web',
    });
  });

  test('legacy create task keeps sending empty subtask, assignee and custom value defaults', async () => {
    await runAction({ action: moxieCreateTaskAction, props: { name: 'T', clientName: 'Acme', projectName: 'Site', status: 'To Do' } });
    expect(lastRequest()['body']).toEqual({
      name: 'T',
      clientName: 'Acme',
      projectName: 'Site',
      status: 'To Do',
      tasks: [],
      assignedTo: [],
      customValues: {},
    });
  });

  test('delete calendar event returns the id and a deleted flag', async () => {
    ok({ body: undefined });
    await expect(runAction({ action: moxieDeleteCalendarEventAction, props: { eventId: 'ev1' } })).resolves.toEqual({
      id: 'ev1',
      deleted: true,
    });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.DELETE, url: `${BASE}/action/calendar/ev1` });
  });

  test('a second delete fails with a not-found message', async () => {
    fail({ status: 404 });
    await expect(runAction({ action: moxieDeleteCalendarEventAction, props: { eventId: 'ev1' } })).rejects.toThrow(
      'may already be deleted',
    );
  });

  test('list vendors and form names wrap bare strings in objects', async () => {
    ok({ body: ['Adobe', 'Figma'] });
    await expect(runAction({ action: moxieListVendorsAction, props: {} })).resolves.toEqual([{ name: 'Adobe' }, { name: 'Figma' }]);
    ok({ body: ['Intake'] });
    await expect(runAction({ action: moxieListFormNamesAction, props: {} })).resolves.toEqual([{ name: 'Intake' }]);
    expect(lastRequest()['url']).toBe(`${BASE}/action/formNames/list`);
  });

  test('attach from URL returns the stored URL with the record it was attached to', async () => {
    ok({ body: 'https://files.withmoxie.com/x.pdf' });
    await expect(
      runAction({
        action: moxieAttachFileFromUrlAction,
        props: { objectType: 'ticket', objectId: 't1', fileUrl: 'https://cdn.example.com/x.pdf', fileName: 'x.pdf' },
      }),
    ).resolves.toEqual({ url: 'https://files.withmoxie.com/x.pdf', objectType: 'TICKET', objectId: 't1', fileName: 'x.pdf' });
  });

  test('upload attachment sends a multipart body with the file', async () => {
    ok({ body: 'https://files.withmoxie.com/up.txt' });
    const file = { filename: 'up.txt', extension: 'txt', data: Buffer.from('hello') };
    await runAction({ action: moxieUploadAttachmentAction, props: { objectType: 'CLIENT', objectId: 'c1', file } });
    const sent = lastRequest();
    expect(sent['url']).toBe(`${BASE}/action/attachments/create`);
    expect(sent['queryParams']).toEqual({ id: 'c1', type: 'CLIENT' });
    const headers = sent['headers'];
    const contentType = typeof headers === 'object' && headers !== null ? Reflect.get(headers, 'Content-Type') : undefined;
    expect(String(contentType)).toMatch(/^multipart\/form-data; boundary=/);
    const payload = sent['body'];
    expect(Buffer.isBuffer(payload) && payload.toString('utf8')).toContain('filename="up.txt"');
    expect(Buffer.isBuffer(payload) && payload.toString('utf8')).toContain('hello');
  });

  test('get workspace account reads the account id first', async () => {
    ok({ body: { accountId: 10016, accountName: 'Moxie' } });
    ok({ body: { accountId: 10016, accountName: 'Moxie', currency: 'USD' } });
    await expect(runAction({ action: moxieGetWorkspaceAccountAction, props: {} })).resolves.toMatchObject({ currency: 'USD' });
    expect(request(0)['url']).toBe(`${BASE}/api/auth`);
    expect(request(1)['url']).toBe(`${BASE}/action/account/10016`);
  });
});

describe('payment retry guard', () => {
  const invoice = {
    id: 'i1',
    invoiceNumberFormatted: 'E-2026-042',
    payments: [{ id: 'pay1', referenceNumber: 'REF-1', amount: 50 }],
  };

  test('a payment whose reference is already on the invoice is not applied again', async () => {
    ok({ body: [invoice] });
    await expect(
      runAction({
        action: moxiePaymentCreateAction,
        props: { invoiceNumber: 'e-2026-042', clientName: 'Acme', amount: 50, referenceNumber: 'REF-1' },
      }),
    ).resolves.toMatchObject({ id: 'i1', already_applied: true });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0)).toMatchObject({ url: `${BASE}/action/payableInvoices/search`, queryParams: { query: 'Acme' } });
  });

  test('a new reference is applied after the check', async () => {
    ok({ body: [invoice] });
    ok({ body: { ...invoice, status: 'PAID' } });
    await expect(
      runAction({
        action: moxieApplyPaymentAction,
        props: {
          invoiceNumber: 'E-2026-042',
          clientName: 'Acme',
          amount: '25',
          referenceNumber: 'REF-2',
          paymentType: 'bank_transfer',
          date: '2026-10-01T00:00:00.000Z',
        },
      }),
    ).resolves.toMatchObject({ status: 'PAID', already_applied: false });
    expect(request(1)).toMatchObject({
      method: HttpMethod.POST,
      url: `${BASE}/action/payment/create`,
      body: {
        invoiceNumber: 'E-2026-042',
        clientName: 'Acme',
        amount: 25,
        date: '2026-10-01',
        paymentType: 'BANK_TRANSFER',
        referenceNumber: 'REF-2',
      },
    });
  });

  test('without a reference the payment is applied directly', async () => {
    ok({ body: invoice });
    await runAction({ action: moxiePaymentCreateAction, props: { invoiceNumber: 'E-2026-042', clientName: 'Acme', amount: 5 } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0)['url']).toBe(`${BASE}/action/payment/create`);
  });

  test('an invoice that is no longer open fails with a clear message', async () => {
    fail({ status: 404, body: { message: 'Invoice not found' } });
    await expect(
      runAction({ action: moxiePaymentCreateAction, props: { invoiceNumber: 'E-1', clientName: 'Acme', amount: 5 } }),
    ).rejects.toThrow('open invoice E-1');
  });
});

describe('input validation happens before any request', () => {
  test.each([
    ['an update with no fields', moxieClientUpdateAction, { clientId: 'c1' }, 'Nothing to update'],
    ['an id with spaces', moxieTaskUpdateAction, { taskId: 'a b', name: 'x' }, 'not a valid Moxie id'],
    ['a field both set and cleared', moxieClientUpdateAction, { clientId: 'c1', notes: 'x', clearFields: ['notes'] }, 'both set and cleared'],
    ['a field that cannot be cleared', moxieClientUpdateAction, { clientId: 'c1', clearFields: ['color'] }, 'cannot be cleared'],
    ['a bad date', moxieProjectUpdateAction, { projectId: 'p1', dueDate: '2026-02-30' }, 'YYYY-MM-DD'],
    ['fee fields without a fee type', moxieProjectCreateAction, { name: 'S', clientName: 'A', amount: 5 }, 'Set Fee Type'],
    ['an invoice without items', moxieInvoiceCreateAction, { clientName: 'Acme', items: [] }, 'at least one line item'],
    ['a negative line rate', moxieInvoiceCreateAction, { clientName: 'Acme', items: [{ description: 'x', quantity: 1, rate: -1 }] }, '0 or more'],
    ['contacts without send', moxieInvoiceCreateAction, { clientName: 'A', items: [{ description: 'x', quantity: 1, rate: 1 }], sendToContacts: ['a@b.co'] }, 'only apply when Send Invoice'],
    ['a zero payment', moxiePaymentCreateAction, { invoiceNumber: 'E-1', clientName: 'A', amount: 0 }, 'more than 0'],
    ['an unknown payment type', moxiePaymentCreateAction, { invoiceNumber: 'E-1', clientName: 'A', amount: 1, paymentType: 'GOLD' }, 'Payment Type must be one of'],
    ['a time entry ending before it starts', moxieTimeEntryCreateAction, { timerStart: '2026-10-01T10:00:00Z', timerEnd: '2026-10-01T09:00:00Z' }, 'after Start Time'],
    ['a calendar create without times', moxieCreateOrUpdateCalendarEventAction, { summary: 'x' }, 'required to create'],
    ['both ticket id and number', moxieUpdateTicketStatusAction, { ticketId: 't1', ticketNumber: 3, status: 'Closed' }, 'exactly one'],
    ['a ticket search with nothing to match', moxieSearchTicketsAction, {}, 'Enter a Query'],
    ['a task search with nothing to match', moxieSearchTasksAction, {}, 'Enter a Query'],
    ['a client search with nothing to match', moxieSearchClientsAction, {}, 'Enter a Query'],
    ['an http file URL', moxieAttachFileFromUrlAction, { objectType: 'CLIENT', objectId: 'c1', fileUrl: 'http://x.io/a', fileName: 'a' }, 'https URL'],
    ['an unknown attachment type', moxieAttachFileFromUrlAction, { objectType: 'INVOICE', objectId: 'c1', fileUrl: 'https://x.io/a', fileName: 'a' }, 'Attach To must be one of'],
    ['an invalid email', moxieCreateTicketAction, { subject: 'x', userEmail: 'nope' }, 'not a valid email'],
    ['an upload that is not a file', moxieUploadAttachmentAction, { objectType: 'CLIENT', objectId: 'c1', file: 'abc' }, 'File is required'],
    ['a ticket comment with no author email', moxieAddTicketCommentAction, { ticketNumber: 1001, comment: 'x' }, 'Author Email is required'],
  ])('rejects %s', async (_label, action, props, message) => {
    await expect(runAction({ action, props })).rejects.toThrow(message);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('dropdowns', () => {
  test('a dropdown shows a disabled reason instead of throwing on 401', async () => {
    fail({ status: 401, body: { message: 'Invalid X-API-Key specified.' } });
    const state = await loadOptions({ prop: moxieUpdateClientAction.props.clientId, values: { auth: { props: { baseUrl: BASE, apiKey: 'k' } } } });
    expect(state).toMatchObject({ disabled: true, options: [] });
    expect(JSON.stringify(state)).toContain('API key');
  });

  test('a dropdown without a connection asks to connect', async () => {
    const state = await loadOptions({ prop: moxieUpdateClientAction.props.clientId, values: {} });
    expect(state).toMatchObject({ disabled: true, placeholder: 'Connect your Moxie account first.' });
  });

  test('the project dropdown of a client with no projects says so', async () => {
    fail({ status: 404, body: { message: 'Client not found' } });
    const state = await loadOptions({
      prop: moxieCreateTaskAction.props.projectName,
      values: { auth: { props: { baseUrl: BASE, apiKey: 'k' } }, clientName: 'Empty Co' },
    });
    expect(state).toMatchObject({ disabled: true, placeholder: 'This client has no projects.' });
  });

  test('the project dropdown waits for a client', async () => {
    const state = await loadOptions({ prop: moxieUpdateProjectAction.props.projectId, values: { auth: { props: {} } } });
    expect(state).toMatchObject({ disabled: true, placeholder: 'Select a client first.' });
  });

  test('the client dropdown lists names as values', async () => {
    ok({ body: [{ id: 'c1', name: 'Acme' }] });
    const state = await loadOptions({ prop: moxieCreateTaskAction.props.clientName, values: { auth: { props: { baseUrl: BASE, apiKey: 'k' } } } });
    expect(state).toEqual({ disabled: false, options: [{ label: 'Acme', value: 'Acme' }] });
  });

  test('the task stage dropdown uses the stages of the selected project type', async () => {
    ok({ body: [{ id: 'p1', name: 'Site', projectTypeId: 'pt9' }] });
    ok({ body: [{ id: 's1', label: 'To Do' }] });
    const state = await loadOptions({
      prop: moxieCreateTaskAction.props.status,
      values: { auth: { props: { baseUrl: BASE, apiKey: 'k' } }, clientName: 'Acme', projectName: 'Site' },
    });
    expect(state).toEqual({ disabled: false, options: [{ label: 'To Do', value: 'To Do' }] });
    expect(request(1)).toMatchObject({ url: `${BASE}/action/taskStages/list`, queryParams: { projectTypeId: 'pt9' } });
  });

  test('the update-task stage dropdown refuses to guess when the project is not found', async () => {
    ok({ body: [] });
    const state = await loadOptions({
      prop: moxieUpdateTaskAction.props.statusId,
      values: { auth: { props: { baseUrl: BASE, apiKey: 'k' } }, projectId: 'missing' },
    });
    expect(state).toMatchObject({ disabled: true });
    expect(JSON.stringify(state)).toContain('Project not found');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  test('every dynamic dropdown lists its parent props in refreshers', () => {
    expect(moxieUpdateTaskAction.props.taskId.refreshers).toEqual(['projectId']);
    expect(moxieUpdateTaskAction.props.statusId.refreshers).toEqual(['projectId']);
    expect(moxieCreateTimeEntryAction.props.deliverableName.refreshers).toEqual(['clientName', 'projectName']);
    expect(moxieApplyPaymentAction.props.invoiceNumber.refreshers).toEqual(['clientName']);
    expect(moxieCreateInvoiceAction.props.sendToContacts.refreshers).toEqual(['clientName']);
  });
});

type Case = {
  name: string;
  action: { run: unknown };
  props: Record<string, unknown>;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, string>;
};
