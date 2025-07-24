
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { HttpMethod, httpClient } from '@activepieces/pieces-common';
    import { newContact } from './lib/triggers/new-contact';
    import { newSale } from './lib/triggers/new-sale';
    import { tagAddedToContact } from './lib/triggers/tag-added-to-contact';
    import { createContact } from './lib/actions/create-contact';
    import { updateContact } from './lib/actions/update-contact';
    import { addTagToContact } from './lib/actions/add-tag-to-contact';
    import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
    import { findContactByEmail } from './lib/actions/find-contact-by-email';

    const systemeioAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Get your API key from your Systeme.io account settings.',
      validate: async ({ auth }) => {
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.systeme.io/api/contacts?limit=10',
            headers: {
              'X-API-Key': auth,
            },
          });
          if (response.status === 200) {
            return { valid: true };
          } else {
            return { valid: false, error: 'Invalid API Key or API error' };
          }
        } catch (e) {
          return {
            valid: false,
            error: 'Network or API error',
          };
        }
      },
    });

    export const systemeio = createPiece({
      displayName: "systeme.io",
      auth: systemeioAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/systemeio.png",
      authors: ["Your Name <you@example.com>"],
      actions: [createContact, updateContact, addTagToContact, removeTagFromContact, findContactByEmail],
      triggers: [newContact, newSale, tagAddedToContact],
    });
    