
    import { createPiece } from "@activepieces/pieces-framework";
    import { insightoAiAuth } from './lib/common/auth';
    import { newCapturedForm } from './lib/triggers/new-captured-form';
    import { newConversation } from './lib/triggers/new-conversation';
    import { newContact } from './lib/triggers/new-contact';
    import { addTextBlobToDataSource } from './lib/actions/add-text-blob';
    import { upsertContact } from './lib/actions/upsert-contact';
    import { makeOutboundCall } from './lib/actions/make-outbound-call';
    import { createCampaign } from './lib/actions/create-campaign';

    export const insightoAi = createPiece({
      displayName: 'Insighto-ai',
      auth: insightoAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/insighto-ai.png',
      authors: ['Prabhukiran161'],
      actions: [
        addTextBlobToDataSource,
        upsertContact,
        makeOutboundCall,
        createCampaign,
      ],
      triggers: [newCapturedForm, newConversation, newContact],
    });
    