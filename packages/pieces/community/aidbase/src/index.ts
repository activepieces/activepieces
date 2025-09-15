import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { aidbaseAuth } from './common';
import { addFaqItem } from './lib/actions/add-faq-item';
import { addVideo } from './lib/actions/add-video';
import { addWebsite } from './lib/actions/add-website';
import { createChatbotReply } from './lib/actions/create-chatbot-reply';
import { createFaq } from './lib/actions/create-faq';
import { startTraining } from './lib/actions/start-training';
import { emailPriorityChanged } from './lib/triggers/email-priority-changed';
import { emailReceived } from './lib/triggers/email-received';
import { emailSent } from './lib/triggers/email-sent';
import { emailStatusChanged } from './lib/triggers/email-status-changed';
import { ticketCreated } from './lib/triggers/ticket-created';
import { ticketNewComment } from './lib/triggers/ticket-new-comment';
import { ticketPriorityChanged } from './lib/triggers/ticket-priority-changed';
import { ticketStatusChanged } from './lib/triggers/ticket-status-changed';

export const aidbase = createPiece({
  displayName: 'Aidbase',
  description:
    'Aidbase is an AI-powered customer support & knowledge base tool that helps businesses automate ticketing, frequently asked questions (FAQs), chatbot replies, and knowledge ingestion.',
  categories: [PieceCategory.CUSTOMER_SUPPORT, PieceCategory.COMMUNICATION],
  auth: aidbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aidbase.png',
  authors: ['LuizDMM'],
  actions: [
    addVideo,
    createFaq,
    startTraining,
    addFaqItem,
    addWebsite,
    createChatbotReply,
    createCustomApiCallAction({
      auth: aidbaseAuth,
      baseUrl: () => 'https://api.aidbase.ai/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [
    emailReceived,
    emailStatusChanged,
    ticketNewComment,
    ticketStatusChanged,
    emailPriorityChanged,
    emailSent,
    ticketCreated,
    ticketPriorityChanged,
  ],
});
