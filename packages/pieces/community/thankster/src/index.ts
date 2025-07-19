
    import { createPiece, PieceAuth } from "@ensemble/pieces-framework";
    import { sendCards } from './lib/actions/send-cards';

    export const thanksterAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Go My Profile page to find your API Key at the bottom.',
    });

    export const thankster = createPiece({
      displayName: "Thankster",
      auth: thanksterAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.ensemble.com/pieces/thankster.png",
      authors: [],
      actions: [sendCards],
      triggers: [],
    });
    