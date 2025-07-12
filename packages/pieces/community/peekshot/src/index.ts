
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { captureScreenshot } from "./lib/actions/capture-screenshot";

    export const peekshotAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Please provide your API Key',
    });

    export const peekshot = createPiece({
      displayName: 'PeekShot',
      auth: peekshotAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://peekshot.com/logo.png',
      authors: [],
      actions: [captureScreenshot],
      triggers: [],
    });
