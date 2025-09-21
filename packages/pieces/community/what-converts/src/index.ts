import { createPiece } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from './lib/common/auth';

import { createLead } from './lib/actions/create-lead';
import { updateLead } from './lib/actions/update-lead';
import { createExport } from './lib/actions/create-export';
import { findLead } from './lib/actions/find-lead';

import { newLead } from './lib/triggers/new-lead';
import { updatedLead } from './lib/triggers/updated-lead'; 

export const whatConverts = createPiece({
  displayName: 'WhatConverts',
  auth: whatConvertsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/what-converts.png',
  authors: [],
  actions: [
    createLead,
    updateLead,
    createExport,
    findLead,
  ],
  triggers: [
    newLead,
    updatedLead, 
  ],
});