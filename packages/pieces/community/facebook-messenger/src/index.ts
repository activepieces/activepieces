
    import { createPiece } from "@activepieces/pieces-framework";
    import { PieceCategory } from '@activepieces/shared';
    import { newMessage } from "./lib/triggers/new-message";
    import { pushMessage } from "./lib/actions/push-message";
    import { facebookAuth } from "./lib/auth/facebook-auth";

    export const facebookMessenger = createPiece({
      displayName: "Facebook-messenger",
      description: 'Manage your Facebook Chat',
      auth: facebookAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
      categories: [PieceCategory.COMMUNICATION],
      authors: ["tumrabert"],
      actions: [pushMessage],
      triggers: [newMessage],
    });
