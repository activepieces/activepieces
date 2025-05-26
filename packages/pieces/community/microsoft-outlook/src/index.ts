
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

   export const outlookAuth = PieceAuth.OAuth2({
      description: 'Authentication for Microsoft Outlook',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      required: true,
      scope: ["Mail.Read", "Mail.Send", "Calendars.Read", "offline_access"]
    });

    export const microsoftOutlook = createPiece({
      displayName: "Microsoft Outlook",
      auth: outlookAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/microsoft-outlook.png",
      authors: [],
      actions: [],
      triggers: [],
    });
