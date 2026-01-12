import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { sendMessageAction } from "./lib/actions/send-message";
import { PieceCategory } from "@activepieces/shared";

export const chatflyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your ChatFly API key',
  required: true,
});

export const chatfly = createPiece({
  displayName: "Chatfly",
  description: "ChatFly allows you to build AI chatbots trained on your data.",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: chatflyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/chatfly.png",
  authors: ["onyedikachi-david"],
  actions: [sendMessageAction],
  triggers: [],
});
