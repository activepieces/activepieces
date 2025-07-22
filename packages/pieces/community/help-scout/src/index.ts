
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { addNote } from "./lib/actions/add-note";
import { createConversation } from "./lib/actions/create-conversation";
import { createCustomer } from "./lib/actions/create-customer";
import { findConversation } from "./lib/actions/find-conversation";
import { findCustomer } from "./lib/actions/find-customer-";
import { findUser } from "./lib/actions/find-user";
import { sendReply } from "./lib/actions/send-reply";
import { updateCustomerProperties } from "./lib/actions/update-customer-properties";

export const helpScout = createPiece({
  displayName: "Help-scout",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/help-scout.png",
  authors: ['Sanket6652'],
  actions: [addNote, createConversation, createCustomer, findConversation, findCustomer, findUser, sendReply, updateCustomerProperties],
  triggers: [],
});
