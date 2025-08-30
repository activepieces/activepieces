
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const togglTrack = createPiece({
      displayName: "Toggl-track",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/toggl-track.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    