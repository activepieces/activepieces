import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newDealTrigger } from './lib/triggers/new-deal';
import { updatedLeadTrigger } from './lib/triggers/updated-lead';
import { updatedContactTrigger } from './lib/triggers/updated-contact';
import { updatedDealTrigger } from './lib/triggers/updated-deal';
import { dealEntersNewStageTrigger } from './lib/triggers/deal-enters-new-stage';
import { newNoteTrigger } from './lib/triggers/new-note';

import { createContactAction } from './lib/actions/create-contact';
import { createLeadAction } from './lib/actions/create-lead';
import { createDealAction } from './lib/actions/create-deal';
import { updateContactAction } from './lib/actions/update-contact';
import { updateDealAction } from './lib/actions/update-deal';
import { createNoteAction } from './lib/actions/create-note';
import { createTaskAction } from './lib/actions/create-task';
import { findDealAction } from './lib/actions/find-deal';
import { findContactAction } from './lib/actions/find-contact';
import { findLeadAction } from './lib/actions/find-lead';
import { findCompanyAction } from './lib/actions/find-company';
import { findUserAction } from './lib/actions/find-user';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const zendeskSellAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Zendesk Sell API key (Access Token)',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.getbase.com/v2/users/self',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.status === 200) {
        return {
          valid: true,
        };
      }
      
      return {
        valid: false,
        error: 'Invalid API key',
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key or unable to connect to Zendesk Sell',
      };
    }
  },
});

export const zendeskSell = createPiece({
  displayName: 'Zendesk Sell',
  description: 'Sales automation platform for managing leads, contacts, deals, and pipelines',
  auth: zendeskSellAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk-sell.png',
  authors: ['Ani-4x'],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
  triggers: [
    newContactTrigger,
    newLeadTrigger,
    newDealTrigger,
    updatedLeadTrigger,
    updatedContactTrigger,
    updatedDealTrigger,
    dealEntersNewStageTrigger,
    newNoteTrigger,
  ],
  actions: [
    createContactAction,
    createLeadAction,
    createDealAction,
    updateContactAction,
    updateDealAction,
    createNoteAction,
    createTaskAction,
    findDealAction,
    findContactAction,
    findLeadAction,
    findCompanyAction,
    findUserAction,
  ],
});
