
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { makeClient } from "./lib/common";
import { campaignSendFinishedTrigger, contactAddedTrigger, contactBouncedTrigger, contactClickedTrigger, contactGroupUpdatedTrigger, contactNoteAddedTrigger, contactOpenedTrigger, contactRepliedTrigger, contactStatusUpdatedTrigger, contactTagUpdatedTrigger, contactUnsubscribedTrigger, contactUpdatedTrigger, formSubmittedTrigger, pagePerformedTrigger, surveySubmittedTrigger, transactionCreatedTrigger, transactionSentTrigger } from "./lib/triggers";
import { updateContactTags, sendCampaign, createAudienceGroup, updateContactGroup, createContactNote, updateContactJourney, updateContactStatus, generateCustomEvent, updateJourneyStatus, createSuppressionFilter, getAudiences, getAudienceGroups, getCampaigns, getContact, getCustomEvent, getJourney, createContact, createTransaction } from "./lib/actions";

const authGuide = `
To obtain your Tarvent Account ID and API Key, follow these steps:

1. Log in to your Tarvent account.
2. Go to **Account->API Keys** section.
3. **Create an API key** and copy it. Make sure to give it the correct permissions.
4. The **Account ID** is available to copy at the top right
`;

export const tarventAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(auth);
      await client.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    }
  },
});

export const tarvent = createPiece({
  displayName: "Tarvent",
  description: "Tarvent is an email marketing, automation, and email API platform that allows to you to send campaigns, manage contacts, automate your marketing, and more.",
  auth: tarventAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tarvent.png',
  categories: [PieceCategory.MARKETING, PieceCategory.FORMS_AND_SURVEYS],
  authors: ["derekjdev","206mph"],
  actions: [createContact, updateContactTags, updateContactGroup, createContactNote, updateContactJourney, updateContactStatus, createAudienceGroup, updateJourneyStatus, createTransaction, sendCampaign, generateCustomEvent, getAudiences, getAudienceGroups, createSuppressionFilter, getCampaigns, getContact, getCustomEvent, getJourney],
  triggers: [contactAddedTrigger, contactGroupUpdatedTrigger, contactUpdatedTrigger, contactStatusUpdatedTrigger, contactTagUpdatedTrigger, contactNoteAddedTrigger, contactUnsubscribedTrigger, formSubmittedTrigger, pagePerformedTrigger, surveySubmittedTrigger, contactClickedTrigger, contactOpenedTrigger, contactRepliedTrigger, contactBouncedTrigger,campaignSendFinishedTrigger, transactionCreatedTrigger, transactionSentTrigger],
});
