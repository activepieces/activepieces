import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { linklyAuth, LINKLY_API_BASE } from './lib/auth';
import { createLink } from './lib/actions/create-link';
import { updateLink } from './lib/actions/update-link';
import { getLink } from './lib/actions/get-link';
import { listLinks } from './lib/actions/list-links';
import { deleteLink } from './lib/actions/delete-link';
import { getClickAnalytics } from './lib/actions/get-click-analytics';
import { getClickBreakdown } from './lib/actions/get-click-breakdown';
import { listDomains } from './lib/actions/list-domains';
import { reportConversion } from './lib/actions/report-conversion';
import { newClick } from './lib/triggers/new-click';
import { linkCreated } from './lib/triggers/link-created';
import { linkUpdated } from './lib/triggers/link-updated';
import { linkDeleted } from './lib/triggers/link-deleted';

export const linkly = createPiece({
  displayName: 'Linkly',
  description:
    'URL shortener with click tracking, branded domains, retargeting pixels, geo and device redirects, and real-time click webhooks.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/linkly.png',
  categories: [PieceCategory.MARKETING],
  auth: linklyAuth,
  authors: ['chrism2671'],
  actions: [
    createLink,
    updateLink,
    getLink,
    listLinks,
    deleteLink,
    getClickAnalytics,
    getClickBreakdown,
    listDomains,
    reportConversion,
    createCustomApiCallAction({
      auth: linklyAuth,
      baseUrl: () => LINKLY_API_BASE,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newClick, linkCreated, linkUpdated, linkDeleted],
});
