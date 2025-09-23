
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { addTextBlobAction } from "./lib/actions/add-text-blob-action";
    import { upsertContactAction } from "./lib/actions/upsert-contact-action";
    import { makeOutboundCallAction } from "./lib/actions/make-outbound-call-action";
    import { createCampaignAction } from "./lib/actions/create-campaign-action";
    import { newCapturedForm } from "./lib/triggers/new-captured-form";
    import { newConversation } from "./lib/triggers/new-conversation";
    import { newContact } from "./lib/triggers/new-contact";
    import { PieceCategory } from "@activepieces/shared";

    export const insightoAi = createPiece({
      displayName: "Insighto.ai",
      description: "AI-powered platform for capturing forms, conversations, and data sources with automated processing and outbound communications",
      auth: PieceAuth.SecretText({
        displayName: "API Key",
        description: "Your Insighto.ai API key",
        required: true,
      }),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/insighto-ai.png",
      authors: ['fortunamide', 'onyedikachi-david'],
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.COMMUNICATION],
      actions: [addTextBlobAction, upsertContactAction, makeOutboundCallAction, createCampaignAction],
      triggers: [newCapturedForm, newConversation, newContact],
    });
    