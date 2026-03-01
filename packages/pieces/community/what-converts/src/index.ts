import { createPiece } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../src/lib/common/auth';
import { createLeadAction } from '../src/lib/actions/create-lead';
import { exportLeadsAction } from '../src/lib/actions/create-export';
import { updateLeadAction } from '../src/lib/actions/update-lead';
import { findLeadAction } from '../src/lib/actions/find-lead';
import { newLeadTrigger } from '../src/lib/triggers/new-lead';
import { updatedLeadTrigger } from '../src/lib/triggers/update-lead';
import { PieceCategory } from '@activepieces/shared';

export const whatConverts = createPiece({
  displayName: 'WhatConverts',
  auth: whatConvertsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/what-converts.png',
  authors: ['Prabhukiran161', 'sanket-a11y'],
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  actions: [
    createLeadAction,
    exportLeadsAction,
    updateLeadAction,
    findLeadAction,
  ],
  triggers: [newLeadTrigger, updatedLeadTrigger],
});
