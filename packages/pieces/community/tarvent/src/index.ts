import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'
import { AppConnectionType, PieceCategory } from '@activepieces/shared'
import {
    createAudienceGroup,
    createContact,
    createContactNote,
    createSuppressionFilter,
    createTransaction,
    generateCustomEvent,
    getAudienceGroups,
    getAudiences,
    getCampaigns,
    getContact,
    getCustomEvent,
    getJourney,
    sendCampaign,
    updateContactGroup,
    updateContactJourney,
    updateContactStatus,
    updateContactTags,
    updateJourneyStatus,
} from './lib/actions'
import { tarventAuth } from './lib/auth'
import { makeClient } from './lib/common'
import {
    campaignSendFinishedTrigger,
    contactAddedTrigger,
    contactBouncedTrigger,
    contactClickedTrigger,
    contactGroupUpdatedTrigger,
    contactNoteAddedTrigger,
    contactOpenedTrigger,
    contactRepliedTrigger,
    contactStatusUpdatedTrigger,
    contactTagUpdatedTrigger,
    contactUnsubscribedTrigger,
    contactUpdatedTrigger,
    formSubmittedTrigger,
    pagePerformedTrigger,
    surveySubmittedTrigger,
    transactionCreatedTrigger,
    transactionSentTrigger,
} from './lib/triggers'

const authGuide = `
To obtain your Tarvent Account ID and API Key, follow these steps:

1. Log in to your Tarvent account.
2. Go to **Account->API Keys** section.
3. **Create an API key** and copy it. Make sure to give it the correct permissions.
4. The **Account ID** is available to copy at the top right
`

export const tarvent = createPiece({
    displayName: 'Tarvent',
    description:
        'Tarvent is an email marketing, automation, and email API platform that allows to you to send campaigns, manage contacts, automate your marketing, and more.',
    auth: tarventAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/tarvent.png',
    categories: [PieceCategory.MARKETING, PieceCategory.FORMS_AND_SURVEYS],
    authors: ['derekjdev', '206mph'],
    actions: [
        createContact,
        updateContactTags,
        updateContactGroup,
        createContactNote,
        updateContactJourney,
        updateContactStatus,
        createAudienceGroup,
        updateJourneyStatus,
        createTransaction,
        sendCampaign,
        generateCustomEvent,
        getAudiences,
        getAudienceGroups,
        createSuppressionFilter,
        getCampaigns,
        getContact,
        getCustomEvent,
        getJourney,
    ],
    triggers: [
        contactAddedTrigger,
        contactGroupUpdatedTrigger,
        contactUpdatedTrigger,
        contactStatusUpdatedTrigger,
        contactTagUpdatedTrigger,
        contactNoteAddedTrigger,
        contactUnsubscribedTrigger,
        formSubmittedTrigger,
        pagePerformedTrigger,
        surveySubmittedTrigger,
        contactClickedTrigger,
        contactOpenedTrigger,
        contactRepliedTrigger,
        contactBouncedTrigger,
        campaignSendFinishedTrigger,
        transactionCreatedTrigger,
        transactionSentTrigger,
    ],
})
