import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createNotebookAction } from './lib/actions/create-notebook';
import { createSectionAction } from './lib/actions/create-section';
import { createPageAction } from './lib/actions/create-page';
import { createImagePageAction } from './lib/actions/create-image-page';
import { appendNoteAction } from './lib/actions/append-note';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';

const authGuide = `
To obtain your Microsoft Graph API access token, follow these steps:

1. Go to the Azure Portal (https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Create a new app registration or use an existing one
4. Under "API permissions", add the following permissions:
   - Notes.ReadWrite (for creating and reading notes)
   - Notes.Create (for creating notes only)
5. Generate a client secret under "Certificates & secrets"
6. Use the client credentials flow to obtain an access token
`;

export const microsoftOneNoteAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    access_token: Property.ShortText({
      displayName: 'Access Token',
      description: 'Microsoft Graph API access token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // Basic validation - check if token is provided
      if (!auth.access_token) {
        return {
          valid: false,
          error: 'Access token is required',
        };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid access token',
      };
    }
  },
});

export const microsoftOnenote = createPiece({
  displayName: 'Microsoft OneNote',
  description: 'Create and manage OneNote notebooks, sections, and pages.',
  auth: microsoftOneNoteAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-onenote.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['activepieces'],
  actions: [
    createNotebookAction,
    createSectionAction,
    createPageAction,
    createImagePageAction,
    appendNoteAction,
  ],
  triggers: [
    newNoteInSectionTrigger,
  ],
}); 