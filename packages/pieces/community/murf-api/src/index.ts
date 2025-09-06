
import { createPiece } from "@activepieces/pieces-framework";
import { murfAuth } from "./lib/common/auth";
import { createProject } from "./lib/actions/create-project";
import { listVoices } from "./lib/actions/list-voices";
import { translateText } from "./lib/actions/translate-text";
import { voiceChange } from "./lib/actions/voice-change";
import { textToSpeech } from "./lib/actions/text-to-speech";

export const murfApi = createPiece({
  displayName: "Murf-api",
  auth: murfAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/murf-api.png",
  authors: ["Niket2035"],
  actions: [createProject, listVoices, translateText, voiceChange, textToSpeech],
  triggers: [],
});
