import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { tldvAuth } from "./lib/common/auth";
import { uploadRecording } from "./lib/actions/upload-recording";
import { listMeetings } from "./lib/actions/list-meetings";
import { getMeeting } from "./lib/actions/get-meeting";
import { getTranscript } from "./lib/actions/get-transcript";
import { getHighlights } from "./lib/actions/get-highlights";
import { meetingReady } from "./lib/triggers/meeting-ready";
import { transcriptReady } from "./lib/triggers/transcript-ready";

export { tldvAuth } from "./lib/common/auth";

export const tlDv = createPiece({
  displayName: "tl;dv",
  description: "Record meetings, get transcripts, and access meeting notes automatically.",
  auth: tldvAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/tl-dv.png",
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["onyedikachi-david"],
  actions: [
    uploadRecording,
    listMeetings,
    getMeeting,
    getTranscript,
    getHighlights,
  ],
  triggers: [
    meetingReady,
    transcriptReady,
  ],
});