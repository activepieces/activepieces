
import { createPiece } from "@activepieces/pieces-framework";
import { humeAiAuth } from "./lib/common/auth";
import { generateTextToSpeech } from "./lib/actions/generate-text-to-speech";
import { generateSpeechFromFile } from "./lib/actions/generate-speech-from-file";
import { createVoice } from "./lib/actions/create-voice";
import { deleteVoice } from "./lib/actions/delete-voice";
import { analyzeEmotionsFromUrl } from "./lib/actions/analyze-emotions-from-url";
import { getEmotionResults } from "./lib/actions/get-emotion-results";
import { newVoiceTrigger } from "./lib/triggers/new-voice";

export const humeAi = createPiece({
  displayName: "Hume-ai",
  auth: humeAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/hume-ai.png",
      authors: ["onyedikachi-david"],
      actions: [generateTextToSpeech, generateSpeechFromFile, createVoice, deleteVoice, analyzeEmotionsFromUrl, getEmotionResults],
      triggers: [newVoiceTrigger],
    });
    