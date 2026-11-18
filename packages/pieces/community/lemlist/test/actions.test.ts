import { afterEach, describe, expect, it, vi } from 'vitest';
import { lemlist } from '../src';
import { addCustomVariablesOnLead } from '../src/lib/actions/add-custom-variables-on-lead';
import { addLeadToACampaign } from '../src/lib/actions/add-lead-to-a-campaign';
import { listActivitiesAction } from '../src/lib/actions/ai/activities';
import {
  createCampaignAction,
  getCampaignAction,
  getCampaignSequencesAction,
  getCampaignStatsAction,
  listCampaignSchedulesAction,
  listCampaignsAction,
  listSchedulesAction,
  pauseCampaignAction,
  startCampaignAction,
  updateCampaignAction,
} from '../src/lib/actions/ai/campaigns';
import {
  createCompanyNoteAction,
  createContactNoteAction,
  getCompanyAction,
  getContactAction,
  listCompaniesAction,
  listCompanyNotesAction,
  listContactNotesAction,
  listContactsAction,
  upsertCompanyAction,
  upsertContactAction,
} from '../src/lib/actions/ai/crm';
import { enrichLeadAction, getEnrichmentResultAction } from '../src/lib/actions/ai/enrichment';
import { createLabelAction, getContactMessagesAction, listLabelsAction, sendInboxEmailAction } from '../src/lib/actions/ai/inbox';
import {
  createLeadInCampaignAction,
  deleteLeadFromCampaignAction,
  eraseLeadVariablesAction,
  getLeadByEmailAction,
  launchLeadAction,
  listCampaignLeadsAction,
  markLeadInterestedInCampaignAction,
  markLeadNotInterestedInCampaignAction,
  pauseLeadEverywhereAction,
  pauseLeadInCampaignAction,
  resumeLeadEverywhereAction,
  resumeLeadInCampaignAction,
  unsubscribeLeadFromCampaignAction,
  updateCampaignLeadAction,
  updateLeadVariablesAction,
} from '../src/lib/actions/ai/leads';
import { createTaskAction, ignoreTasksAction, listTasksAction, updateTaskAction } from '../src/lib/actions/ai/tasks';
import { getTeamAction, getTeamCreditsAction, listTeamSendersAction } from '../src/lib/actions/ai/team';
import { addUnsubscribeAction, getUnsubscribeAction, listUnsubscribesAction, resubscribeEmailAction } from '../src/lib/actions/ai/unsubscribes';
import { listWebhooksAction } from '../src/lib/actions/ai/webhooks';
import { markLeadFromAllCampaignAsInterested } from '../src/lib/actions/mark-lead-from-all-campaign-as-interested';
import { markLeadFromAllCampaignsAsNotInterested } from '../src/lib/actions/mark-lead-from-all-campaigns-as-not-interested';
import { markLeadFromOneCampaignAsInterested } from '../src/lib/actions/mark-lead-from-one-campaign-as-interested';
import { markLeadFromOneCampaignAsNotInterested } from '../src/lib/actions/mark-lead-from-one-campaign-as-not-interested';
import { pauseLeadFromAllOrSpecificCampaigns } from '../src/lib/actions/pause-lead-from-all-or-specific-campaigns';
import { removeLeadFromACampaign } from '../src/lib/actions/remove-lead-from-a-campaign';
import { removeLeadFromUnsubscribeList } from '../src/lib/actions/remove-lead-from-unsubscribe-list';
import { resumeLeadFromAllOrSpecificCampaigns } from '../src/lib/actions/resume-lead-from-all-or-specific-campaigns';
import { searchLead } from '../src/lib/actions/search-lead';
import { unsubscribeALead } from '../src/lib/actions/unsubscribe-a-lead';
import { updateLeadFromCampaign } from '../src/lib/actions/update-lead-from-campaign';
import { API_KEY, makeContext, stubFetch } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const CAM = 'cam_A1';
const LEA = 'lea_B2';
const EMAIL = 'jane+x@example.com';
const ENC = encodeURIComponent(EMAIL);

type Case = {
  action: { name: string; run: unknown };
  props: Record<string, unknown>;
  response?: unknown;
  status?: number;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  output?: unknown;
};

function call({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return fn(ctx);
}

const CASES: Case[] = [
  { action: markLeadFromAllCampaignAsInterested, props: { email: EMAIL }, response: [{ _id: LEA }], method: 'POST', path: `/leads/interested/${ENC}`, output: [{ _id: LEA }] },
  { action: markLeadFromAllCampaignsAsNotInterested, props: { email: EMAIL }, response: [], method: 'POST', path: `/leads/notinterested/${ENC}` },
  { action: markLeadFromOneCampaignAsInterested, props: { campaignId: CAM, email: EMAIL }, response: { _id: LEA }, method: 'POST', path: `/campaigns/${CAM}/leads/${ENC}/interested` },
  { action: markLeadFromOneCampaignAsNotInterested, props: { campaignId: CAM, email: EMAIL }, response: { _id: LEA }, method: 'POST', path: `/campaigns/${CAM}/leads/${ENC}/notinterested` },
  { action: pauseLeadFromAllOrSpecificCampaigns, props: { campaignId: CAM, email: EMAIL }, response: [], method: 'POST', path: `/leads/pause/${ENC}`, query: { campaignId: CAM } },
  { action: pauseLeadFromAllOrSpecificCampaigns, props: { email: EMAIL }, response: [], method: 'POST', path: `/leads/pause/${ENC}`, query: {} },
  { action: resumeLeadFromAllOrSpecificCampaigns, props: { campaignId: CAM, email: EMAIL }, response: [], method: 'POST', path: `/leads/start/${ENC}`, query: { campaignId: CAM } },
  { action: removeLeadFromUnsubscribeList, props: { email: EMAIL }, response: { _id: 'uns_1', value: EMAIL }, method: 'DELETE', path: `/unsubscribes/${ENC}` },
  { action: removeLeadFromACampaign, props: { campaignId: CAM, email: EMAIL }, response: { _id: LEA }, method: 'DELETE', path: `/campaigns/${CAM}/leads/${ENC}`, query: { action: 'remove' } },
  { action: unsubscribeALead, props: { campaignId: CAM, email: EMAIL }, response: { _id: LEA }, method: 'DELETE', path: `/campaigns/${CAM}/leads/${ENC}`, query: {} },
  {
    action: addLeadToACampaign,
    props: { campaignId: CAM, email: EMAIL, firstName: 'Jane', lastName: '', deduplicate: true, findEmail: true, verifyEmail: false },
    response: { _id: LEA },
    method: 'POST',
    path: `/campaigns/${CAM}/leads/`,
    query: { deduplicate: 'true', findEmail: 'true' },
    body: { firstName: 'Jane', email: EMAIL },
  },
  { action: addCustomVariablesOnLead, props: { leadId: LEA, customVariables: { icebreaker: 'Hi there', score: 7 } }, response: { ok: true }, method: 'POST', path: `/leads/${LEA}/variables`, query: {}, body: { icebreaker: 'Hi there', score: '7' } },
  { action: updateLeadFromCampaign, props: { campaignId: CAM, email: EMAIL, jobTitle: 'CTO', phone: '' }, response: { _id: LEA }, method: 'PATCH', path: `/campaigns/${CAM}/leads/${ENC}`, body: { jobTitle: 'CTO' } },
  {
    action: searchLead,
    props: { email: EMAIL, campaignId: CAM },
    response: [{ _id: 'lea_1', campaign: { id: 'cam_other' } }, { _id: 'lea_2', campaign: { id: CAM } }],
    method: 'GET',
    path: `/leads/${ENC}`,
    query: { version: 'v2' },
    output: { found: true, leads: [{ _id: 'lea_2', campaign: { id: CAM } }] },
  },
  { action: getTeamAction, props: {}, response: { _id: 'tea_1' }, method: 'GET', path: '/team', query: { version: 'v2' } },
  { action: listTeamSendersAction, props: { state: 'running' }, response: [{ userId: 'usr_1', campaigns: [] }], method: 'GET', path: '/team/senders', query: { state: 'running' }, output: { items: [{ userId: 'usr_1', campaigns: [] }], count: 1, offset: 0, has_more: false } },
  { action: getTeamCreditsAction, props: {}, response: { credits: 5 }, method: 'GET', path: '/team/credits' },
  {
    action: listCampaignsAction,
    props: { status: 'running', limit: 2, offset: 4 },
    response: { campaigns: [{ _id: 'cam_1' }, { _id: 'cam_2' }] },
    method: 'GET',
    path: '/campaigns',
    query: { version: 'v2', limit: '2', offset: '4', sortBy: 'createdAt', sortOrder: 'desc', status: 'running' },
    output: { items: [{ _id: 'cam_1' }, { _id: 'cam_2' }], count: 2, offset: 4, has_more: true },
  },
  { action: getCampaignAction, props: { campaign_id: CAM }, response: { _id: CAM }, method: 'GET', path: `/campaigns/${CAM}` },
  {
    action: getCampaignStatsAction,
    props: { campaign_id: CAM, start_date: '2026-10-01', end_date: '2026-10-31' },
    response: { nbLeads: 3 },
    method: 'GET',
    path: `/v2/campaigns/${CAM}/stats`,
    query: { startDate: '2026-10-01T00:00:00.000Z', endDate: '2026-10-31T00:00:00.000Z' },
  },
  { action: getCampaignSequencesAction, props: { campaign_id: CAM }, response: { seq_1: { _id: 'seq_1', steps: [] } }, method: 'GET', path: `/campaigns/${CAM}/sequences`, output: { sequences: [{ _id: 'seq_1', steps: [] }], count: 1 } },
  { action: listCampaignSchedulesAction, props: { campaign_id: CAM }, response: [{ _id: 'skd_1' }], method: 'GET', path: `/campaigns/${CAM}/schedules/`, output: { items: [{ _id: 'skd_1' }], count: 1 } },
  { action: listSchedulesAction, props: {}, response: { schedules: [{ _id: 'skd_1' }] }, method: 'GET', path: '/schedules', query: { limit: '100', offset: '0', sortBy: 'createdAt', sortOrder: 'desc' }, output: { items: [{ _id: 'skd_1' }], count: 1 } },
  { action: createCampaignAction, props: { name: ' Test ', timezone: '' }, response: { _id: CAM }, method: 'POST', path: '/campaigns', body: { name: 'Test' } },
  { action: updateCampaignAction, props: { campaign_id: CAM, stopOnEmailReplied: false, name: 'N' }, response: { name: 'N' }, method: 'PATCH', path: `/campaigns/${CAM}`, body: { name: 'N', stopOnEmailReplied: false } },
  { action: updateCampaignAction, props: { campaign_id: CAM, name: 'N', stopOnEmailReplied: 'no', stopOnMeetingBooked: 'yes', stopOnLinkClicked: 'unchanged', disableTrackOpen: undefined, disableTrackClick: '', disableTrackReply: true }, response: { name: 'N' }, method: 'PATCH', path: `/campaigns/${CAM}`, body: { name: 'N', stopOnEmailReplied: false, stopOnMeetingBooked: true, disableTrackReply: true } },
  { action: updateCampaignAction, props: { campaign_id: CAM, name: 'Renamed', stopOnEmailReplied: 'unchanged', stopOnMeetingBooked: 'unchanged', stopOnLinkClicked: 'unchanged', disableTrackOpen: 'unchanged', disableTrackClick: 'unchanged', disableTrackReply: 'unchanged' }, response: { name: 'Renamed' }, method: 'PATCH', path: `/campaigns/${CAM}`, body: { name: 'Renamed' } },
  { action: startCampaignAction, props: { campaign_id: CAM }, response: { _id: CAM, state: 'running' }, method: 'POST', path: `/campaigns/${CAM}/start` },
  { action: pauseCampaignAction, props: { campaign_id: CAM }, response: { _id: CAM, state: 'paused' }, method: 'POST', path: `/campaigns/${CAM}/pause` },
  { action: listCampaignLeadsAction, props: { campaign_id: CAM, state: 'interested', limit: 1 }, response: [{ _id: LEA }], method: 'GET', path: `/campaigns/${CAM}/leads/`, query: { state: 'interested', limit: '1', offset: '0' }, output: { items: [{ _id: LEA }], count: 1, offset: 0, has_more: true } },
  { action: listCampaignLeadsAction, props: { campaign_id: CAM, limit: 2, offset: 4 }, response: [{ _id: LEA }], method: 'GET', path: `/campaigns/${CAM}/leads/`, query: { limit: '2', offset: '4' }, output: { items: [{ _id: LEA }], count: 1, offset: 4, has_more: false } },
  { action: createLeadInCampaignAction, props: { campaign_id: CAM, email: EMAIL, companyName: 'Acme', deduplicate: false }, response: { _id: LEA }, method: 'POST', path: `/campaigns/${CAM}/leads/`, query: {}, body: { companyName: 'Acme', email: EMAIL } },
  { action: getLeadByEmailAction, props: { email: EMAIL }, status: 404, response: { message: 'Lead not found' }, method: 'GET', path: `/leads/${ENC}`, output: { found: false, message: `No lead found for ${EMAIL}.`, leads: [] } },
  { action: updateCampaignLeadAction, props: { campaign_id: CAM, lead: LEA, lastName: 'Doe' }, response: { _id: LEA }, method: 'PATCH', path: `/campaigns/${CAM}/leads/${LEA}`, body: { lastName: 'Doe' } },
  { action: deleteLeadFromCampaignAction, props: { campaign_id: CAM, lead: LEA }, response: { _id: LEA }, method: 'DELETE', path: `/campaigns/${CAM}/leads/${LEA}`, query: { action: 'remove' }, output: { deleted: true, alreadyRemoved: false, lead: { _id: LEA } } },
  { action: deleteLeadFromCampaignAction, props: { campaign_id: CAM, lead: LEA }, status: 404, response: {}, method: 'DELETE', path: `/campaigns/${CAM}/leads/${LEA}`, output: { deleted: false, alreadyRemoved: true, lead: null } },
  { action: unsubscribeLeadFromCampaignAction, props: { campaign_id: CAM, lead: EMAIL }, response: { _id: LEA }, method: 'DELETE', path: `/campaigns/${CAM}/leads/${ENC}`, query: {} },
  { action: pauseLeadInCampaignAction, props: { campaign_id: CAM, lead: LEA }, response: [{ _id: LEA }], method: 'POST', path: `/leads/pause/${LEA}`, query: { campaignId: CAM }, output: { leads: [{ _id: LEA }], count: 1 } },
  { action: pauseLeadEverywhereAction, props: { lead: EMAIL }, response: [], method: 'POST', path: `/leads/pause/${ENC}`, query: {}, output: { leads: [], count: 0 } },
  { action: resumeLeadInCampaignAction, props: { campaign_id: CAM, lead: LEA }, response: [], method: 'POST', path: `/leads/start/${LEA}`, query: { campaignId: CAM } },
  { action: resumeLeadEverywhereAction, props: { lead: LEA }, response: { _id: LEA }, method: 'POST', path: `/leads/start/${LEA}`, output: { leads: [{ _id: LEA }], count: 1 } },
  { action: launchLeadAction, props: { lead_id: LEA }, response: { ok: true }, method: 'POST', path: `/leads/review/${LEA}` },
  { action: markLeadInterestedInCampaignAction, props: { campaign_id: CAM, lead: LEA }, response: { _id: LEA }, method: 'POST', path: `/campaigns/${CAM}/leads/${LEA}/interested` },
  { action: markLeadNotInterestedInCampaignAction, props: { campaign_id: CAM, lead: LEA }, response: { _id: LEA }, method: 'POST', path: `/campaigns/${CAM}/leads/${LEA}/notinterested` },
  { action: updateLeadVariablesAction, props: { lead_id: LEA, variables: { icebreaker: 'Yo' } }, response: { ok: true }, method: 'PATCH', path: `/leads/${LEA}/variables`, query: {}, body: { icebreaker: 'Yo' } },
  { action: eraseLeadVariablesAction, props: { lead_id: LEA, variable_names: ['icebreaker', 'score'] }, response: { ok: true }, method: 'DELETE', path: `/leads/${LEA}/variables`, query: { icebreaker: '', score: '' } },
  { action: enrichLeadAction, props: { lead_id: LEA, find_phone: true }, response: { id: 'enr_1' }, method: 'POST', path: `/leads/${LEA}/enrich`, query: { findPhone: 'true' } },
  { action: getEnrichmentResultAction, props: { enrichment_id: 'enr_1' }, response: { enrichmentId: 'enr_1', enrichmentStatus: 'done', data: {} }, method: 'GET', path: '/enrich/enr_1', output: { enrichmentId: 'enr_1', enrichmentStatus: 'done', data: {}, done: true } },
  { action: getEnrichmentResultAction, props: { enrichment_id: 'enr_1' }, status: 202, response: undefined, method: 'GET', path: '/enrich/enr_1', output: { enrichmentId: 'enr_1', done: false, enrichmentStatus: 'in_progress', input: null, data: null } },
  {
    action: listActivitiesAction,
    props: { type: 'emailsReplied', campaign_id: CAM, lead_id: LEA, min_date: '2026-10-01T00:00:00Z', limit: 10 },
    response: [{ _id: 'act_1' }],
    method: 'GET',
    path: '/activities',
    query: { version: 'v2', type: 'emailsReplied', campaignId: CAM, leadId: LEA, minDate: '2026-10-01T00:00:00.000Z', limit: '10', offset: '0' },
    output: { items: [{ _id: 'act_1' }], count: 1, offset: 0, has_more: false },
  },
  { action: listUnsubscribesAction, props: { offset: 100 }, response: [{ _id: 'uns_1' }], method: 'GET', path: '/unsubscribes', query: { limit: '100', offset: '100' } },
  { action: getUnsubscribeAction, props: { value: 'acme.com' }, response: { _id: 'uns_1', value: 'acme.com' }, method: 'GET', path: '/unsubscribes/acme.com', output: { unsubscribed: true, record: { _id: 'uns_1', value: 'acme.com' } } },
  { action: getUnsubscribeAction, props: { value: EMAIL }, status: 404, response: {}, method: 'GET', path: `/unsubscribes/${ENC}`, output: { unsubscribed: false, record: null } },
  { action: addUnsubscribeAction, props: { value: EMAIL }, response: { _id: 'uns_1' }, method: 'POST', path: `/unsubscribes/${ENC}` },
  { action: resubscribeEmailAction, props: { value: EMAIL }, status: 404, response: {}, method: 'DELETE', path: `/unsubscribes/${ENC}`, output: { removed: false, record: null } },
  { action: upsertContactAction, props: { email: EMAIL, firstName: 'Jane', update_strategy: 'fillEmptyOnly' }, response: { success: true }, method: 'POST', path: '/contacts', query: { updateStrategy: 'fillEmptyOnly' }, body: { email: EMAIL, firstName: 'Jane' } },
  { action: getContactAction, props: { contact: EMAIL }, response: [{ _id: 'ctc_1' }], method: 'GET', path: '/contacts', query: { idsOrEmails: EMAIL }, output: { found: true, contact: { _id: 'ctc_1' } } },
  { action: getContactAction, props: { contact: 'ctc_1' }, response: { _id: 'ctc_1' }, method: 'GET', path: '/contacts/ctc_1', output: { found: true, contact: { _id: 'ctc_1' } } },
  { action: listContactsAction, props: { search: 'Jan', limit: 5 }, response: { data: [{ _id: 'ctc_1' }], total: 1 }, method: 'GET', path: '/contacts', query: { search: 'Jan', limit: '5', offset: '0' }, output: { items: [{ _id: 'ctc_1' }], count: 1, offset: 0, has_more: false } },
  { action: createContactNoteAction, props: { contact: 'ctc_1', note: 'Met' }, response: { _id: 'act_n' }, method: 'POST', path: '/contacts/ctc_1/notes', body: { note: 'Met' } },
  { action: listContactNotesAction, props: { contact: 'ctc_1', limit: 1 }, response: { data: [{ _id: 'act_n' }], total: 2 }, method: 'GET', path: '/contacts/ctc_1/notes', query: { page: '1', limit: '1', sortBy: 'createdAt', sortOrder: 'desc' }, output: { items: [{ _id: 'act_n' }], total: 2, page: 1, has_more: true } },
  { action: upsertCompanyAction, props: { domain: 'acme.com', name: 'Acme' }, response: { success: true }, method: 'POST', path: '/companies', query: {}, body: { domain: 'acme.com', name: 'Acme' } },
  { action: getCompanyAction, props: { company_id: 'cpn_1' }, response: { _id: 'cpn_1' }, method: 'GET', path: '/companies/cpn_1' },
  { action: listCompaniesAction, props: { ids_or_domains: 'acme.com, cpn_2' }, response: [{ _id: 'cpn_2' }], method: 'GET', path: '/companies', query: { idsOrDomains: 'acme.com,cpn_2', limit: '100', offset: '0' }, output: { items: [{ _id: 'cpn_2' }], count: 1, offset: 0, has_more: false } },
  { action: createCompanyNoteAction, props: { company_id: 'cpn_1', note: 'Hot' }, response: { _id: 'act_c' }, method: 'POST', path: '/companies/cpn_1/notes', body: { note: 'Hot' } },
  { action: listCompanyNotesAction, props: { company_id: 'cpn_1' }, response: { data: [], total: 0 }, method: 'GET', path: '/companies/cpn_1/notes', output: { items: [], total: 0, page: 1, has_more: false } },
  {
    action: getContactMessagesAction,
    props: { contact_id: 'ctc_1', limit: 1 },
    response: { data: [{ _id: 'act_m' }], pagination: { totalItems: 3 } },
    method: 'GET',
    path: '/inbox/ctc_1',
    query: { limit: '1', skip: '0' },
    output: { items: [{ _id: 'act_m' }], count: 1, total: 3, has_more: true },
  },
  {
    action: sendInboxEmailAction,
    props: { send_user_id: 'usr_1', send_user_email: 'me@example.com', send_user_mailbox_id: 'usm_1', lead_id: LEA, subject: 'Hi', message: '<p>Hello</p>', cc: ['a@example.com'] },
    response: { ok: true, contactId: 'ctc_1' },
    method: 'POST',
    path: '/inbox/email',
    body: { sendUserId: 'usr_1', sendUserEmail: 'me@example.com', sendUserMailboxId: 'usm_1', leadId: LEA, subject: 'Hi', message: '<p>Hello</p>', cc: ['a@example.com'] },
  },
  { action: listLabelsAction, props: {}, response: [{ _id: 'lbl_1' }], method: 'GET', path: '/inbox/labels', output: { items: [{ _id: 'lbl_1' }], count: 1 } },
  { action: createLabelAction, props: { name: 'Hot' }, response: { _id: 'lbl_1' }, method: 'POST', path: '/inbox/labels', body: { labelName: 'Hot' } },
  {
    action: createTaskAction,
    props: { record_id: 'ctc_1', type: 'manual', assigned_to: 'usr_1', due_date: '2026-10-20', title: 'Call', priority: '' },
    response: { _id: 'opp_1' },
    method: 'POST',
    path: '/tasks',
    body: { recordId: 'ctc_1', type: 'manual', assignedTo: 'usr_1', dueDate: '2026-10-20T00:00:00.000Z', title: 'Call' },
  },
  { action: listTasksAction, props: { page: 2 }, response: { results: [{ _id: 'opp_1' }], page: '2' }, method: 'GET', path: '/tasks', query: { filters: '[]', page: '2' }, output: { items: [{ _id: 'opp_1' }], count: 1, page: 2 } },
  { action: updateTaskAction, props: { task_id: 'opp_1', done: true }, response: { _id: 'opp_1' }, method: 'PATCH', path: '/tasks', body: { done: true, id: 'opp_1' } },
  { action: updateTaskAction, props: { task_id: 'opp_1', done: 'no' }, response: { _id: 'opp_1' }, method: 'PATCH', path: '/tasks', body: { done: false, id: 'opp_1' } },
  { action: updateTaskAction, props: { task_id: 'opp_1', title: 'T', done: 'unchanged' }, response: { _id: 'opp_1' }, method: 'PATCH', path: '/tasks', body: { title: 'T', id: 'opp_1' } },
  { action: ignoreTasksAction, props: { task_ids: ['opp_1', 'opp_1', 'opp_2'] }, response: {}, method: 'POST', path: '/tasks/ignore', body: { ids: ['opp_1', 'opp_2'] }, output: { ignored: ['opp_1', 'opp_2'], count: 2, response: {} } },
  { action: listWebhooksAction, props: {}, response: [{ _id: 'hoo_1' }], method: 'GET', path: '/hooks', output: { items: [{ _id: 'hoo_1' }], count: 1 } },
];

describe('every action sends the documented request', () => {
  it.each(CASES.map((c, i) => [`${i} ${c.action.name}`, c] as const))('%s', async (_label, c) => {
    const calls = stubFetch([{ status: c.status ?? 200, body: c.response }]);
    const result = await call({ fn: c.action.run, ctx: makeContext({ props: c.props }) });
    expect(calls).toHaveLength(1);
    const req = calls[0];
    expect(req.method).toBe(c.method);
    expect(req.url.origin).toBe('https://api.lemlist.com');
    expect(req.url.pathname).toBe(`/api${c.path}`);
    expect(req.headers['authorization']).toBe(`Basic ${Buffer.from(`:${API_KEY}`).toString('base64')}`);
    if (c.query !== undefined) {
      expect(Object.fromEntries(req.url.searchParams.entries())).toEqual(c.query);
    }
    if (c.body !== undefined) {
      expect(req.body).toEqual(c.body);
    }
    if (c.output !== undefined) {
      expect(result).toEqual(c.output);
    }
  });

  it('covers every registered action except Custom API Call', () => {
    const tested = new Set(CASES.map((c) => c.action.name));
    const registered = Object.keys(lemlist.actions()).filter((name) => name !== 'custom_api_call');
    expect(registered.filter((name) => !tested.has(name))).toEqual([]);
  });
});

describe('metadata', () => {
  const actions = Object.values(lemlist.actions());
  it('every action has classification, aiMetadata and an outputSchema', () => {
    for (const action of actions) {
      expect(action.classification, action.name).toBeDefined();
      if (action.name !== 'custom_api_call') {
        expect(action.aiMetadata?.description, action.name).toBeTruthy();
        expect(action.outputSchema, action.name).toBeDefined();
      }
    }
  });

  it('counts audiences', () => {
    const counts: Record<string, number> = {};
    for (const action of actions) {
      const audience = action.audience ?? 'both';
      counts[audience] = (counts[audience] ?? 0) + 1;
    }
    expect(counts).toEqual({ both: 4, human: 10, ai: 54 });
  });

  it('ai actions take IDs as text, never dropdowns', () => {
    for (const action of actions.filter((a) => a.audience === 'ai')) {
      for (const prop of Object.values(action.props)) {
        expect(prop.type, action.name).not.toBe('DROPDOWN');
      }
    }
  });
});

describe('review fixes', () => {
  it('upsert contact with overwrite sends supplied empty fields so they are cleared', async () => {
    const calls = stubFetch([{ body: { _id: 'ctc_1' } }]);
    await call({ fn: upsertContactAction.run, ctx: makeContext({ props: { email: 'jane@example.com', phone: '', jobTitle: undefined, update_strategy: 'overwrite' } }) });
    expect(calls[0].body).toEqual({ email: 'jane@example.com', phone: '' });
  });

  it('upsert contact without overwrite still drops empty fields', async () => {
    const calls = stubFetch([{ body: { _id: 'ctc_1' } }]);
    await call({ fn: upsertContactAction.run, ctx: makeContext({ props: { email: 'jane@example.com', phone: '', update_strategy: 'overwriteIgnoreEmpty' } }) });
    expect(calls[0].body).toEqual({ email: 'jane@example.com' });
  });

  it('upsert company with overwrite sends supplied empty fields but never an empty identifier', async () => {
    const calls = stubFetch([{ body: { _id: 'cpn_1' } }]);
    await call({ fn: upsertCompanyAction.run, ctx: makeContext({ props: { domain: 'acme.com', linkedinUrl: '', industry: '', update_strategy: 'overwrite' } }) });
    expect(calls[0].body).toEqual({ domain: 'acme.com', industry: '' });
  });

  it('update task offers no empty priority option, so an omitted priority means unchanged', () => {
    const options = (updateTaskAction.props.priority as unknown as { options: { options: { value: string }[] } }).options.options;
    expect(options.map((o) => o.value)).toEqual(['0', '1', '2']);
  });
});
