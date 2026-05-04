import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { engagebayAuth } from './lib/auth';
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { getContactsAction } from './lib/actions/get-contacts';
import { searchContactsAction } from './lib/actions/search-contacts';
import { createContactGroupAction } from './lib/actions/create-contact-group';
import { getContactGroupsAction } from './lib/actions/get-contact-groups';

export const engagebay = createPiece({
  displayName: 'EngageBay',
  description:
    'All-in-one CRM and marketing automation platform.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/engagebay.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.MARKETING],
  auth: engagebayAuth,
  authors: ['tarai-dl'],
  actions: [
    createContactAction,
    updateContactAction,
    getContactsAction,
    searchContactsAction,
    createContactGroupAction,
    getContactGroupsAction,
  ],
  triggers: [],
});
