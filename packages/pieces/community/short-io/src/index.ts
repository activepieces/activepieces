import {
  createCustomApiCallAction
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { shortIoAuth } from './lib/common/auth';
import { createCountryTargetingRuleAction } from './lib/actions/create-country-targeting-for-a-link';
import { createShortLinkAction } from './lib/actions/create-short-link';
import { deleteShortLinkAction } from './lib/actions/delete-short-link';
import { expireShortLinkAction } from './lib/actions/expire-short-link';
import { domainStatisticsAction } from './lib/actions/domain-statistics';
import { getLinkByPathAction } from './lib/actions/get-link-by-path';
import { getLinkClicksAction } from './lib/actions/get-link-clicks';
import { listLinksAction } from './lib/actions/list-links';
import { updateShortLinkAction } from './lib/actions/update-short-link';
import { newLinkCreatedTrigger } from './lib/triggers/new-link-created';

export const shortIo = createPiece({
  displayName: 'Short.io',
  auth: shortIoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/short-io.png',
  authors: ['aryel780'],
  actions: [
    createCountryTargetingRuleAction,
    createShortLinkAction,
    deleteShortLinkAction,
    expireShortLinkAction,
    domainStatisticsAction,
    getLinkByPathAction,
    getLinkClicksAction,
    listLinksAction,
    updateShortLinkAction,
    createCustomApiCallAction({
      auth: shortIoAuth,
      baseUrl: () => 'https://api.short.io',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: apiKey,
        };
      },
    }),
  ],
  triggers: [newLinkCreatedTrigger],
});
