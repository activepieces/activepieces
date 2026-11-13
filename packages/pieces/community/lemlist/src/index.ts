import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { addCustomVariablesOnLead } from './lib/actions/add-custom-variables-on-lead';
import { addLeadToACampaign } from './lib/actions/add-lead-to-a-campaign';
import { listActivitiesAction } from './lib/actions/ai/activities';
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
} from './lib/actions/ai/campaigns';
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
} from './lib/actions/ai/crm';
import { enrichLeadAction, getEnrichmentResultAction } from './lib/actions/ai/enrichment';
import {
  createLabelAction,
  getContactMessagesAction,
  listLabelsAction,
  sendInboxEmailAction,
} from './lib/actions/ai/inbox';
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
} from './lib/actions/ai/leads';
import { createTaskAction, ignoreTasksAction, listTasksAction, updateTaskAction } from './lib/actions/ai/tasks';
import { getTeamAction, getTeamCreditsAction, listTeamSendersAction } from './lib/actions/ai/team';
import {
  addUnsubscribeAction,
  getUnsubscribeAction,
  listUnsubscribesAction,
  resubscribeEmailAction,
} from './lib/actions/ai/unsubscribes';
import { listWebhooksAction } from './lib/actions/ai/webhooks';
import { markLeadFromAllCampaignAsInterested } from './lib/actions/mark-lead-from-all-campaign-as-interested';
import { markLeadFromAllCampaignsAsNotInterested } from './lib/actions/mark-lead-from-all-campaigns-as-not-interested';
import { markLeadFromOneCampaignAsInterested } from './lib/actions/mark-lead-from-one-campaign-as-interested';
import { markLeadFromOneCampaignAsNotInterested } from './lib/actions/mark-lead-from-one-campaign-as-not-interested';
import { pauseLeadFromAllOrSpecificCampaigns } from './lib/actions/pause-lead-from-all-or-specific-campaigns';
import { removeLeadFromACampaign } from './lib/actions/remove-lead-from-a-campaign';
import { removeLeadFromUnsubscribeList } from './lib/actions/remove-lead-from-unsubscribe-list';
import { resumeLeadFromAllOrSpecificCampaigns } from './lib/actions/resume-lead-from-all-or-specific-campaigns';
import { searchLead } from './lib/actions/search-lead';
import { unsubscribeALead } from './lib/actions/unsubscribe-a-lead';
import { updateLeadFromCampaign } from './lib/actions/update-lead-from-campaign';
import { basicAuthHeader, BASE_URL } from './lib/common/client';
import { lemlistAuth } from './lib/common/constants';
import { newActivity } from './lib/triggers/new-activity';
import { unsubscribedRecipient } from './lib/triggers/unsubscribed-recipient';

export const lemlist = createPiece({
  displayName: 'Lemlist',
  auth: lemlistAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/lemlist.png',
  authors: ['gs03-dev'],
  actions: [
    markLeadFromOneCampaignAsInterested,
    markLeadFromOneCampaignAsNotInterested,
    markLeadFromAllCampaignAsInterested,
    markLeadFromAllCampaignsAsNotInterested,
    pauseLeadFromAllOrSpecificCampaigns,
    resumeLeadFromAllOrSpecificCampaigns,
    removeLeadFromUnsubscribeList,
    removeLeadFromACampaign,
    unsubscribeALead,
    addLeadToACampaign,
    addCustomVariablesOnLead,
    updateLeadFromCampaign,
    searchLead,
    getTeamAction,
    listTeamSendersAction,
    getTeamCreditsAction,
    listCampaignsAction,
    getCampaignAction,
    getCampaignStatsAction,
    getCampaignSequencesAction,
    listCampaignSchedulesAction,
    listSchedulesAction,
    createCampaignAction,
    updateCampaignAction,
    startCampaignAction,
    pauseCampaignAction,
    listCampaignLeadsAction,
    createLeadInCampaignAction,
    getLeadByEmailAction,
    updateCampaignLeadAction,
    deleteLeadFromCampaignAction,
    unsubscribeLeadFromCampaignAction,
    pauseLeadInCampaignAction,
    pauseLeadEverywhereAction,
    resumeLeadInCampaignAction,
    resumeLeadEverywhereAction,
    launchLeadAction,
    markLeadInterestedInCampaignAction,
    markLeadNotInterestedInCampaignAction,
    updateLeadVariablesAction,
    eraseLeadVariablesAction,
    enrichLeadAction,
    getEnrichmentResultAction,
    listActivitiesAction,
    listUnsubscribesAction,
    getUnsubscribeAction,
    addUnsubscribeAction,
    resubscribeEmailAction,
    upsertContactAction,
    getContactAction,
    listContactsAction,
    createContactNoteAction,
    listContactNotesAction,
    upsertCompanyAction,
    getCompanyAction,
    listCompaniesAction,
    createCompanyNoteAction,
    listCompanyNotesAction,
    getContactMessagesAction,
    sendInboxEmailAction,
    listLabelsAction,
    createLabelAction,
    createTaskAction,
    listTasksAction,
    updateTaskAction,
    ignoreTasksAction,
    listWebhooksAction,
    createCustomApiCallAction({
      auth: lemlistAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({ Authorization: basicAuthHeader(auth.secret_text) }),
    }),
  ],
  triggers: [newActivity, unsubscribedRecipient],
});
