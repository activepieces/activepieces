import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { addTagToLinksAction } from './lib/actions/add-tag-to-links';
import { createLinkAiAction } from './lib/actions/ai/create-link';
import { deleteLinkAiAction } from './lib/actions/ai/delete-link';
import { findLinkByPathAiAction } from './lib/actions/ai/find-link-by-path';
import { getDomainStatisticsAiAction } from './lib/actions/ai/get-domain-statistics';
import { listLinksAiAction } from './lib/actions/ai/list-links';
import { setCountryRuleAiAction } from './lib/actions/ai/set-country-rule';
import { updateLinkAiAction } from './lib/actions/ai/update-link';
import { archiveLinkAction } from './lib/actions/archive-link';
import { createCountryTargetingRuleAction } from './lib/actions/create-country-targeting-for-a-link';
import { createFolderAction } from './lib/actions/create-folder';
import { createLinksBulkAction } from './lib/actions/create-links-bulk';
import { createShortLinkAction } from './lib/actions/create-short-link';
import { deleteCountryRuleAction } from './lib/actions/delete-country-rule';
import { duplicateLinkAction } from './lib/actions/duplicate-link';
import { getFolderAction } from './lib/actions/get-folder';
import { getLinkOpenGraphAction } from './lib/actions/get-link-open-graph';
import { deleteShortLinkAction } from './lib/actions/delete-short-link';
import { domainStatisticsAction } from './lib/actions/domain-statistics';
import { expireShortLinkAction } from './lib/actions/expire-short-link';
import { findLinksByOriginalUrlAction } from './lib/actions/find-links-by-original-url';
import { generateQrCodeAction } from './lib/actions/generate-qr-code';
import { getDomainAction } from './lib/actions/get-domain';
import { getLinkAction } from './lib/actions/get-link';
import { getLinkByPathAction } from './lib/actions/get-link-by-path';
import { getLinkClicksAction } from './lib/actions/get-link-clicks';
import { getTopLinksAction } from './lib/actions/get-top-links';
import { listCountryRulesAction } from './lib/actions/list-country-rules';
import { listDomainsAction } from './lib/actions/list-domains';
import { listFoldersAction } from './lib/actions/list-folders';
import { listLinksAction } from './lib/actions/list-links';
import { listRecentClicksAction } from './lib/actions/list-recent-clicks';
import { unarchiveLinkAction } from './lib/actions/unarchive-link';
import { updateShortLinkAction } from './lib/actions/update-short-link';
import { shortIoAuth } from './lib/common/auth';
import { newLinkCreatedTrigger } from './lib/triggers/new-link-created';

export const shortIo = createPiece({
  displayName: 'Short.io',
  auth: shortIoAuth,
  minimumSupportedRelease: '0.88.2',
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
    listDomainsAction,
    getDomainAction,
    getLinkAction,
    findLinksByOriginalUrlAction,
    createLinksBulkAction,
    archiveLinkAction,
    unarchiveLinkAction,
    addTagToLinksAction,
    generateQrCodeAction,
    listFoldersAction,
    createFolderAction,
    listCountryRulesAction,
    deleteCountryRuleAction,
    listRecentClicksAction,
    getTopLinksAction,
    duplicateLinkAction,
    getFolderAction,
    getLinkOpenGraphAction,
    createLinkAiAction,
    updateLinkAiAction,
    findLinkByPathAiAction,
    listLinksAiAction,
    deleteLinkAiAction,
    setCountryRuleAiAction,
    getDomainStatisticsAiAction,
    createCustomApiCallAction({
      auth: shortIoAuth,
      baseUrl: () => 'https://api.short.io',
      authMapping: async (auth) => ({
        Authorization: auth.props.apiKey,
      }),
    }),
  ],
  triggers: [newLinkCreatedTrigger],
});
