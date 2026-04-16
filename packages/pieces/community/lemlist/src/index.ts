import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { addLeadToACampaign } from './lib/actions/add-lead-to-a-campaign'
import { markLeadFromAllCampaignAsInterested } from './lib/actions/mark-lead-from-all-campaign-as-interested'
import { markLeadFromAllCampaignsAsNotInterested } from './lib/actions/mark-lead-from-all-campaigns-as-not-interested'
import { markLeadFromOneCampaignAsInterested } from './lib/actions/mark-lead-from-one-campaign-as-interested'
import { markLeadFromOneCampaignAsNotInterested } from './lib/actions/mark-lead-from-one-campaign-as-not-interested'
import { pauseLeadFromAllOrSpecificCampaigns } from './lib/actions/pause-lead-from-all-or-specific-campaigns'
import { removeLeadFromACampaign } from './lib/actions/remove-lead-from-a-campaign'
import { removeLeadFromUnsubscribeList } from './lib/actions/remove-lead-from-unsubscribe-list'
import { resumeLeadFromAllOrSpecificCampaigns } from './lib/actions/resume-lead-from-all-or-specific-campaigns'
import { searchLead } from './lib/actions/search-lead'
import { unsubscribeALead } from './lib/actions/unsubscribe-a-lead'
import { updateLeadFromCampaign } from './lib/actions/update-lead-from-campaign'
import { lemlistAuth } from './lib/common/constants'
import { newActivity } from './lib/triggers/new-activity'
import { unsubscribedRecipient } from './lib/triggers/unsubscribed-recipient'

export const lemlist = createPiece({
    displayName: 'Lemlist',
    auth: lemlistAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/lemlist.png',
    authors: ['gs03-dev'],
    actions: [
        markLeadFromOneCampaignAsInterested,
        markLeadFromOneCampaignAsNotInterested,
        markLeadFromAllCampaignAsInterested,
        markLeadFromAllCampaignsAsNotInterested,
        pauseLeadFromAllOrSpecificCampaigns,
        resumeLeadFromAllOrSpecificCampaigns,
        removeLeadFromUnsubscribeList,
        removeLeadFromACampaign,
        unsubscribeALead,
        addLeadToACampaign,
        updateLeadFromCampaign,
        searchLead,
    ],
    triggers: [newActivity, unsubscribedRecipient],
})
