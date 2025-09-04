
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { DocsBotAuth } from "./lib/common/auth";
import { askQuestion } from "./lib/actions/ask-question";
import { createBot } from "./lib/actions/create-bot";
import { createSource } from "./lib/actions/create-source";
import { uploadSourceFile } from "./lib/actions/upload-source-file";
import { findBot } from "./lib/actions/find-bot";

export const docsbot = createPiece({
  displayName: "Docsbot",
  auth: DocsBotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/docsbot.png",
  authors: ["NiketNannavare"],
  actions: [askQuestion,createBot,createSource,uploadSourceFile,findBot],
  triggers: [],
});
