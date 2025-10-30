
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { findTeam } from "./lib/actions/find-team";
import { findTeamMember } from "./lib/actions/find-team-member";
import { getRecordingTranscript } from "./lib/actions/get-recording-transcript";
import { listMeetings } from "./lib/actions/list-meetings";
import { newRecording } from "./lib/triggers/new-recording";
import { getRecordingSummary } from "./lib/actions/get-recording-summary";
import { FathomAuth } from "./lib/common/auth";

    export const fathom = createPiece({
      displayName: "Fathom",
      auth:FathomAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/fathom.png",
      authors: ["omey12"],
      actions: [findTeam,findTeamMember,getRecordingTranscript,listMeetings,getRecordingSummary],
      triggers: [newRecording],
    });
    