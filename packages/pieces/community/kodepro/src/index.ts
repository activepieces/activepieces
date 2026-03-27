import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import {
  kodeProAuth,
  upsertContact,
  getContact,
  inboundMessage,
  syncTimeline,
  syncWebhookStatus,
  sendSms,
  logEvent,
} from "./lib/common";

export const kodePro = createPiece({
  displayName: "Kode Pro",
  description: "Connect to your Kode Pro dashboard for contacts, messaging, and monitoring",
  auth: kodeProAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://cdn.activepieces.com/pieces/kodepro.png",
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["kodeprollc"],
  actions: [
    upsertContact,
    getContact,
    inboundMessage,
    syncTimeline,
    syncWebhookStatus,
    sendSms,
    logEvent,
  ],
  triggers: [],
});
