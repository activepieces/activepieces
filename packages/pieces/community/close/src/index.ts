import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createLead } from './lib/actions/create-lead';
import { findLead } from './lib/actions/find-lead';
import { newLeadAdded } from './lib/triggers/new-lead-added';
import { createOpportunity } from './lib/actions/create-opportunity';
import { createContact } from './lib/actions/create-contact';
import { newContactAdded } from './lib/triggers/new-contact-added';
import { findContact } from './lib/actions/find-contact';
import { CLOSE_API_URL, closeClient } from './lib/common/client';
import { newOpportunityAdded } from './lib/triggers/new-opportunity';
import { createContactAi } from './lib/actions/ai/create-contact-ai';
import { createLeadAi } from './lib/actions/ai/create-lead-ai';
import { createNote } from './lib/actions/ai/create-note';
import { createOpportunityAi } from './lib/actions/ai/create-opportunity-ai';
import { createTask } from './lib/actions/ai/create-task';
import { deleteActivity } from './lib/actions/ai/delete-activity';
import { deleteContact } from './lib/actions/ai/delete-contact';
import { deleteLead } from './lib/actions/ai/delete-lead';
import { deleteOpportunity } from './lib/actions/ai/delete-opportunity';
import { deleteTask } from './lib/actions/ai/delete-task';
import { getActivity } from './lib/actions/ai/get-activity';
import { getContact } from './lib/actions/ai/get-contact';
import { getCurrentUser } from './lib/actions/ai/get-current-user';
import { getLead } from './lib/actions/ai/get-lead';
import { getOpportunity } from './lib/actions/ai/get-opportunity';
import { getTask } from './lib/actions/ai/get-task';
import { listActivities } from './lib/actions/ai/list-activities';
import { listCustomActivityTypes } from './lib/actions/ai/list-custom-activity-types';
import { listCustomFields } from './lib/actions/ai/list-custom-fields';
import { listLeadStatuses } from './lib/actions/ai/list-lead-statuses';
import { listOpportunities } from './lib/actions/ai/list-opportunities';
import { listPipelines } from './lib/actions/ai/list-pipelines';
import { listSequenceSubscriptions } from './lib/actions/ai/list-sequence-subscriptions';
import { listSequences } from './lib/actions/ai/list-sequences';
import { listSmartViews } from './lib/actions/ai/list-smart-views';
import { listTasks } from './lib/actions/ai/list-tasks';
import { listUsers } from './lib/actions/ai/list-users';
import { logCall } from './lib/actions/ai/log-call';
import { logEmail } from './lib/actions/ai/log-email';
import { mergeLeads } from './lib/actions/ai/merge-leads';
import { pauseSequenceSubscription } from './lib/actions/ai/pause-sequence-subscription';
import { searchContacts } from './lib/actions/ai/search-contacts';
import { searchLeads } from './lib/actions/ai/search-leads';
import { sendSms } from './lib/actions/ai/send-sms';
import { subscribeContactToSequence } from './lib/actions/ai/subscribe-contact-to-sequence';
import { updateContact } from './lib/actions/ai/update-contact';
import { updateLead } from './lib/actions/ai/update-lead';
import { updateNote } from './lib/actions/ai/update-note';
import { updateOpportunity } from './lib/actions/ai/update-opportunity';
import { updateTask } from './lib/actions/ai/update-task';
import { closeAuth } from './lib/auth';

export const close = createPiece({
  displayName: 'Close',
  description: 'Sales automation and CRM integration for Close',
  auth: closeAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/close.png',
  authors: ['Ani-4x', 'kishanprmr', 'OdaiAhmed99'],
  actions: [
    createLead,
    createContact,
    findLead,
    createOpportunity,
    findContact,
    createContactAi,
    createLeadAi,
    createNote,
    createOpportunityAi,
    createTask,
    deleteActivity,
    deleteContact,
    deleteLead,
    deleteOpportunity,
    deleteTask,
    getActivity,
    getContact,
    getCurrentUser,
    getLead,
    getOpportunity,
    getTask,
    listActivities,
    listCustomActivityTypes,
    listCustomFields,
    listLeadStatuses,
    listOpportunities,
    listPipelines,
    listSequenceSubscriptions,
    listSequences,
    listSmartViews,
    listTasks,
    listUsers,
    logCall,
    logEmail,
    mergeLeads,
    pauseSequenceSubscription,
    searchContacts,
    searchLeads,
    sendSms,
    subscribeContactToSequence,
    updateContact,
    updateLead,
    updateNote,
    updateOpportunity,
    updateTask,
    createCustomApiCallAction({
      baseUrl: () => CLOSE_API_URL,
      auth: closeAuth,
      authMapping: async (auth, propsValue) => {
        const urlProp = propsValue['url'];
        const url = closeClient.isRecord(urlProp) && typeof urlProp['url'] === 'string' ? urlProp['url'].trim() : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
          let parsed: URL | undefined;
          try {
            parsed = new URL(url);
          } catch {
            parsed = undefined;
          }
          const base = new URL(CLOSE_API_URL);
          if (!parsed || parsed.username || parsed.password || parsed.origin !== base.origin || !(parsed.pathname === base.pathname || parsed.pathname.startsWith(`${base.pathname}/`))) {
            throw new Error(`The URL must be relative or start with ${CLOSE_API_URL}/.`);
          }
        }
        if (url.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
          throw new Error('The URL must not contain ".." segments.');
        }
        return {
          Authorization: `Basic ${Buffer.from(`${closeClient.keyOf(auth)}:`).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [newLeadAdded, newContactAdded, newOpportunityAdded],
});
