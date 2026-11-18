import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { AppConnectionType, createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addContactToSegmentAction } from './lib/actions/add-contact-to-segment';
import { addSourceAction } from './lib/actions/add-source';
import { checkSourceNowAction } from './lib/actions/check-source-now';
import { createCampaignAction } from './lib/actions/create-campaign';
import { createLocationAction } from './lib/actions/create-location';
import { createOrUpdateContactAction } from './lib/actions/create-or-update-contact';
import { creditTeamMemberAction } from './lib/actions/credit-team-member';
import { findCampaignAction } from './lib/actions/find-campaign';
import { findContactAction } from './lib/actions/find-contact';
import { findLocationAction } from './lib/actions/find-location';
import { findReviewAction } from './lib/actions/find-review';
import { findReviewRequestAction } from './lib/actions/find-review-request';
import { findSourceAction } from './lib/actions/find-source';
import { findTagAction } from './lib/actions/find-tag';
import { findTeamMemberAction } from './lib/actions/find-team-member';
import { getRatingAction } from './lib/actions/get-rating';
import { lookUpBusinessListingAction } from './lib/actions/look-up-business-listing';
import { pauseCampaignAction } from './lib/actions/pause-campaign';
import { removeTagFromReviewAction } from './lib/actions/remove-tag-from-review';
import { replyToReviewAction } from './lib/actions/reply-to-review';
import { sendReviewRequestAction } from './lib/actions/send-review-request';
import { setSourceDimensionAction } from './lib/actions/set-source-dimension';
import { tagReviewAction } from './lib/actions/tag-review';
import { turnOnCampaignAction } from './lib/actions/turn-on-campaign';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { updateCampaignAction } from './lib/actions/update-campaign';
import { writeReplyWithAiAction } from './lib/actions/write-reply-with-ai';
import { reviewflowzAuth } from './lib/auth';
import { REVIEWFLOWZ_API_BASE } from './lib/common/constants';
import { anyEventTrigger } from './lib/triggers/any-event';
import { reviewflowzEventTriggers } from './lib/triggers/event-triggers';

export const reviewflowz = createPiece({
  displayName: 'Reviewflowz',
  description:
    'Collect and answer reviews from Google, Tripadvisor, Trustpilot and 60 more review sites, and ask your customers for new reviews by email or text.',
  auth: reviewflowzAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/reviewflowz.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CUSTOMER_SUPPORT],
  authors: ['J-B-G'],
  actions: [
    sendReviewRequestAction,
    createCampaignAction,
    updateCampaignAction,
    turnOnCampaignAction,
    pauseCampaignAction,
    createOrUpdateContactAction,
    unsubscribeContactAction,
    addContactToSegmentAction,
    replyToReviewAction,
    writeReplyWithAiAction,
    tagReviewAction,
    removeTagFromReviewAction,
    creditTeamMemberAction,
    addSourceAction,
    checkSourceNowAction,
    createLocationAction,
    setSourceDimensionAction,
    findReviewAction,
    findContactAction,
    findCampaignAction,
    findReviewRequestAction,
    findSourceAction,
    findLocationAction,
    findTagAction,
    findTeamMemberAction,
    getRatingAction,
    lookUpBusinessListingAction,
    createCustomApiCallAction({
      baseUrl: () => REVIEWFLOWZ_API_BASE,
      auth: reviewflowzAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.type === AppConnectionType.SECRET_TEXT ? auth.secret_text : auth.access_token}`,
      }),
    }),
  ],
  triggers: [...reviewflowzEventTriggers, anyEventTrigger],
});
