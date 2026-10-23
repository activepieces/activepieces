import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { trulataAuth } from './lib/auth';
import { createLead } from './lib/actions/create-lead';
import { findLead } from './lib/actions/find-lead';
import { listLeads } from './lib/actions/list-leads';
import { updateLeadStatus } from './lib/actions/update-lead-status';
import { listPosts } from './lib/actions/list-posts';
import { newLead, leadStatusChanged, newPost } from './lib/triggers';

export { trulataAuth };

export const trulata = createPiece({
  displayName: 'TruLata',
  description: 'AI marketing software for service businesses: leads, lead status and blog posts.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://trulata.com/favicon.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['TruLata'],
  auth: trulataAuth,
  actions: [createLead, findLead, listLeads, updateLeadStatus, listPosts],
  triggers: [newLead, leadStatusChanged, newPost],
});
