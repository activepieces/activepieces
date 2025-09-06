
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { textToSpeechAction } from "./lib/actions/text-to-speech";
import { translateTextAction } from "./lib/actions/translate-text";
import { createProjectAction } from "./lib/actions/create-project";
import { listVoicesAction } from "./lib/actions/list-voices";
import { voiceChangeAction } from "./lib/actions/voice-change";
import { getAccountInfoAction } from "./lib/actions/get-account-info";

export const murfApi = createPiece({
  displayName: "Murf API",
  description: "AI-powered text-to-speech, voice cloning, and audio processing platform",
  auth: PieceAuth.SecretText({
    displayName: "API Key",
    description: "Your Murf API key. Get it from your Murf account settings.",
    required: true,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/murf-api.png",
  authors: ["sparkybug"],
  actions: [
    textToSpeechAction,
    translateTextAction,
    createProjectAction,
    listVoicesAction,
    voiceChangeAction,
    getAccountInfoAction,
  ],
  triggers: [],
});
    