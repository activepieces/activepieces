
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { systemeAuth, systemeCommon } from './lib/common';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { findContactByEmail } from './lib/actions/find-contact-by-email';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newSaleTrigger } from './lib/triggers/new-sale';
import { newTagAddedToContactTrigger } from './lib/triggers/new-tag-added-to-contact';

    export const systemIo = createPiece({
      displayName: 'Systeme.io',
      description: 'All‑in‑one marketing platform for building sales funnels, email campaigns, membership sites, and more. Automate contact management, trigger on sales and funnel interactions.',
      auth: systemeAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/system-io.png',
      categories: [
        PieceCategory.MARKETING,
        PieceCategory.SALES_AND_CRM,
        PieceCategory.COMMUNICATION,
      ],
      authors: ['sparkybug'],
        actions: [
    createContact,
    updateContact,
    findContactByEmail,
    addTagToContact,
    removeTagFromContact,
    createCustomApiCallAction({
      baseUrl: () => systemeCommon.baseUrl,
      auth: systemeAuth,
      authMapping: async (auth) => ({
        'X-API-Key': auth as string,
      }),
    }),
  ],
  triggers: [
    newContactTrigger,
    newSaleTrigger,
    newTagAddedToContactTrigger,
  ],
    });
    