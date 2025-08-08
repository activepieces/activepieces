import {
  createPiece,
  PieceAuth,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createNotebookAction } from './lib/actions/create-notebook';
import { createSectionAction } from './lib/actions/create-section';
import { createPageAction } from './lib/actions/create-page';
import { createNoteInSectionAction } from './lib/actions/create-note-in-section';
import { createImageNoteAction } from './lib/actions/create-image-note';
import { appendNoteAction } from './lib/actions/append-note';
import { newNoteInSectionTrigger } from './lib/triggers/new-note-in-section';

export const microsoftOneNoteAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft OneNote using Microsoft Graph API',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'Notes.ReadWrite',
    'Notes.Create',
    'User.Read',
    'offline_access'
  ],
  prompt: 'omit',
  validate: async ({ auth }) => {
    try {
      const authValue = auth as OAuth2PropertyValue;
      // Test the token by making a simple API call
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${authValue.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid access token or insufficient permissions',
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate access token',
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
    createNoteInSectionAction,
    createImageNoteAction,
    appendNoteAction,
  ],
  triggers: [newNoteInSectionTrigger],
}); 