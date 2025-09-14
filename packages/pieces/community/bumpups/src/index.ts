import { createPiece } from "@activepieces/pieces-framework";
import { bumpupsAuth } from "./common";
import { sendChat } from "./lib/actions/send-chat";
import { generateTimestamps } from "./lib/actions/generate-timestamps";
import { generateCreatorDescription } from "./lib/actions/generate-creator-description";
import { generateCreatorTakeaways } from "./lib/actions/generate-creator-takeaways";
import { generateCreatorHashtags } from "./lib/actions/generate-creator-hashtags";
import { generateCreatorTitles } from "./lib/actions/generate-creator-titles";

export const bumpups = createPiece({
  displayName: "Bumpups",
  description: "Bumpups is an AI-assisted video content tool. It helps creators by generating auxiliary content (titles, descriptions, takeaways, timestamps, hashtags, etc.) for videos using AI models.",
  auth: bumpupsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/bumpups.png",
  authors: ['devroy10'],
  actions: [generateCreatorDescription, generateCreatorHashtags, generateCreatorTakeaways, generateTimestamps, generateCreatorTitles, sendChat],
  triggers: [],
});
