
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { BumpupsAuth } from "./lib/common/auth";
import { generateCreatorDescription } from "./lib/actions/generate-creator-description";
import { generateCreatorHashtags } from "./lib/actions/generate-creator-hashtags";
import { sendChat } from "./lib/actions/send-chat";
import { generateCreatorTakeaways } from "./lib/actions/generate-creator-takeaways";
import { generateCreatorTitles } from "./lib/actions/generate-creator-titles";
import { generateTimestamps } from "./lib/actions/generate-timestamps";

export const bumpups = createPiece({
  displayName: "Bumpups",
  auth: BumpupsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/bumpups.png",
  authors: ["Niket2035"],
  actions: [generateCreatorDescription, generateCreatorHashtags, generateCreatorTakeaways, generateCreatorTitles, generateTimestamps, sendChat],
  triggers: [],
});
