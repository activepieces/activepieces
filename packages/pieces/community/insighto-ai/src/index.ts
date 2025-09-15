
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { InsightoAuth } from "./lib/common/auth";
import { addTextBlobIntoDataSource } from "./lib/actions/add-text-blob-into-data-source";
import { CreateCampaign } from "./lib/actions/create-campaign";
import { MakeOutboundCall } from "./lib/actions/make-outbound-call";
import { upsertContact } from "./lib/actions/upsert-contact";
import { newCapturedForm } from "./lib/triggers/new-captured-form";
import { newContact } from "./lib/triggers/new-contact";
import { newConversation } from "./lib/triggers/new-conversation";

    export const insightoAi = createPiece({
      displayName: "Insighto-ai",
      auth: InsightoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/insighto-ai.png",
      authors: [],
      actions: [addTextBlobIntoDataSource,CreateCampaign,MakeOutboundCall,upsertContact],
      triggers: [newCapturedForm,newContact,newConversation],
    });
    