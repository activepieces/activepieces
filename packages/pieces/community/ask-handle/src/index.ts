import { createPiece } from "@activepieces/pieces-framework";
import { askHandleAuth } from "./lib/common/auth";
import { createMessage } from "./lib/actions/create-message";
import { createLead } from "./lib/actions/create-lead";
import { listRooms } from "./lib/actions/list-rooms";
import { listLeads } from "./lib/actions/list-leads";
import { newMessageTrigger } from "./lib/triggers/new-message";
import { newLeadTrigger } from "./lib/triggers/new-lead";
import { newRoomTrigger } from "./lib/triggers/new-room";

export const askHandle = createPiece({
  displayName: "AskHandle",
  auth: askHandleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/ask-handle.png",
  authors: ["onyedikachi-david"],
  actions: [
    createMessage,
    createLead,
    listRooms,
    listLeads,
  ],
  triggers: [
    newMessageTrigger,
    newLeadTrigger,
    newRoomTrigger,
  ],
});
