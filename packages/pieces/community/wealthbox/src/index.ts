import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createContact,
  createNote,
  createProject,
  addHouseholdMember,
  createHousehold,
  createEvent,
  createOpportunity,
  createTask,
  startWorkflow,
  findContact,
  findTask
} from './lib/actions';
import {
  newTask,
  newContact,
  newEvent,
  newOpportunity
} from './lib/triggers';

export const wealthboxAuth = PieceAuth.SecretText({
  displayName: 'API Access Token',
  description: 'Enter your Wealthbox API access token. Get it from Settings → API Access Tokens in your Wealthbox account.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.crmworkspace.com/v1/users',
        headers: {
          'ACCESS_TOKEN': auth,
          'Content-Type': 'application/json'
        }
      });

      if (response.status >= 400) {
        return {
          valid: false,
          error: 'Invalid API token. Please check your credentials.'
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate API token. Please check your credentials.'
      };
    }
  }
});
    export const wealthbox = createPiece({
      displayName: "Wealthbox",
      auth: wealthboxAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/wealthbox.png",
      authors: ["fortunamide", "onyedikachi-david"],
      actions: [
        createContact,
        createNote,
        createProject,
        addHouseholdMember,
        createHousehold,
        createEvent,
        createOpportunity,
        createTask,
        startWorkflow,
        findContact,
        findTask
      ],
      triggers: [
        newTask,
        newContact,
        newEvent,
        newOpportunity
      ],
    });
    