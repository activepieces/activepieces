
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { lemlistAuth } from './lib/common/auth';
    import { newActivity } from './lib/triggers/new-activity';
    import { unsubscribedRecipient } from './lib/triggers/unsubscribed-recipient';
    import { markLeadAsInterested } from './lib/actions/mark-lead-interested';
    import { markLeadAsNotInterested } from './lib/actions/mark-lead-notinterested';
    import { markLeadInAllCampaignsAsInterested } from './lib/actions/mark-lead-allcampaigns-interested';
    import { markLeadInAllCampaignsAsNotInterested } from './lib/actions/mark-lead-allcampaigns-notinterested';
    import { pauseLead } from './lib/actions/pause-lead';
    import { resumeLead } from './lib/actions/resume-lead';
    import { addLeadToCampaign } from './lib/actions/add-lead-to-campaign';
    import { removeLeadFromCampaign } from './lib/actions/remove-lead-from-campaign';
    import { removeLeadFromUnsubscribe } from './lib/actions/removelead-from-unsubscribe';
    import { unsubscribeLead } from './lib/actions/unsubscribe-lead';
    import { updateLeadFromCampaign } from './lib/actions/update-lead-from-campaign';
    import { searchLead } from './lib/actions/search-lead';

    export const lemlist = createPiece({
      displayName: 'Lemlist',
      auth: lemlistAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/lemlist.png',
      authors: ['Prabhukiran161'],
      actions: [
        markLeadAsInterested,
        markLeadAsNotInterested,
        markLeadInAllCampaignsAsInterested,
        markLeadInAllCampaignsAsNotInterested,
        pauseLead,
        resumeLead,
        addLeadToCampaign,
        removeLeadFromCampaign,
        removeLeadFromUnsubscribe,
        unsubscribeLead,
        updateLeadFromCampaign,
        searchLead
      ],
      triggers: [newActivity, unsubscribedRecipient],
    });
    