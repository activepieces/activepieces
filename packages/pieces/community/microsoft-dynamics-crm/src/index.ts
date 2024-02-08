import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { testAction } from "./lib/actions/test-action";

export const microsoftDynamicsCRMAuth = PieceAuth.OAuth2({
  description: 'OAUTH2',
  required: true,
  scope: ['https://org77f0100e.crm8.dynamics.com/.default'],
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
})

export const microsoftDynamicsCrm = createPiece({
  displayName: "Microsoft Dynamics CRM",
  auth: microsoftDynamicsCRMAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png",
  authors: [],
  actions: [testAction],
  triggers: [],
});
