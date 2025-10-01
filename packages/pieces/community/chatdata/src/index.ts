
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createChatbot } from "./lib/actions/create-chatbot";
import { updateTheBasePrompt } from "./lib/actions/update-the-base-prompt";
import { ChatDataAuth } from "./lib/common/auth";
import { sendAMessage } from "./lib/actions/send-a-message";
import { retrainAChatbot } from "./lib/actions/retrain-a-chatbot";
import { uploadFile } from "./lib/actions/upload-file";
import { deleteChatbot } from "./lib/actions/delete-chatbot";

    export const chatdata = createPiece({
      displayName: "Chatdata",
      auth: ChatDataAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/chatdata.png",
      authors: ["Niket2035"],
      actions: [createChatbot,updateTheBasePrompt,sendAMessage,retrainAChatbot,uploadFile,deleteChatbot],
      triggers: [],
    });
    