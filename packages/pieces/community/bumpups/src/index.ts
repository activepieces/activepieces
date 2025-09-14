import { createPiece } from "@activepieces/pieces-framework";
import { generateCreatorDescription } from "./lib/actions/generate-creator-description";
import { generateCreatorHashtags } from "./lib/actions/generate-creator-hashtags";
import { generateCreatorTitles } from "./lib/actions/generate-creator-titles";
import { generateTimestamps } from "./lib/actions/generate-timestamps";
import { sendChat } from "./lib/actions/send-chat";
import { bumpupsAuth } from "./common";
import { generateCreatorTakeaways } from "./lib/actions/generate-creator-takeaways";

export const bumpups = createPiece({
  displayName: "Bumpups",
  auth: bumpupsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/bumpups.png",
  authors: ['devroy10'],
  actions: [generateCreatorDescription, generateCreatorHashtags, generateCreatorTakeaways, generateTimestamps, generateCreatorTitles, sendChat],
  triggers: [],
});
