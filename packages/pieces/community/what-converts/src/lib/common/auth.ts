import { PieceAuth } from '@activepieces/pieces-framework';
import { whatConvertsClient } from './client';


export const whatConvertsAuth = PieceAuth.BasicAuth({
  description: 'Get your API Token and Secret from your WhatConverts dashboard under Integrations -> API Keys.',
  required: true,
  username: {
    displayName: 'API Token',
    description: 'Your WhatConverts API Token.',
  },
  password: {
    displayName: 'API Secret',
    description: 'Your WhatConverts API Secret.',
  },

  validate: async ({ auth }) => {
    try {

      await whatConvertsClient.getLeads(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token or Secret.',
      };
    }
  },
});