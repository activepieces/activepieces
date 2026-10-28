import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { callsyncAuth } from './lib/auth';
import { BASE_URL } from './lib/common/client';
import { addNote } from './lib/actions/add-note';
import { createContact } from './lib/actions/create-contact';
import { createTask } from './lib/actions/create-task';
import { findCalls } from './lib/actions/find-calls';
import { findContacts } from './lib/actions/find-contacts';
import { findTasks } from './lib/actions/find-tasks';
import { getCallAnalysis } from './lib/actions/get-call-analysis';
import { updateContact } from './lib/actions/update-contact';
import { updateTask } from './lib/actions/update-task';
import { contactUpdated } from './lib/triggers/contact-updated';
import { newAiAnalysis } from './lib/triggers/new-ai-analysis';
import { newCall } from './lib/triggers/new-call';
import { newRecording } from './lib/triggers/new-recording';

export const callsync = createPiece({
  displayName: 'CallSync',
  description:
    'Call tracking for sales teams: syncs business calls and recordings from Android phones, adds AI call summaries, and keeps a light CRM of contacts, tasks and notes.',
  auth: callsyncAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/callsync.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.SALES_AND_CRM],
  authors: ['digiheadway'],
  actions: [
    findCalls,
    getCallAnalysis,
    createContact,
    updateContact,
    findContacts,
    createTask,
    updateTask,
    findTasks,
    addNote,
    createCustomApiCallAction({
      auth: callsyncAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newCall, newRecording, newAiAnalysis, contactUpdated],
});
