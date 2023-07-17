
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { callMethod } from "./lib/actions/call-method";
import { soapAuth } from "./lib/shared/auth";

export const soap = createPiece({
  displayName: "SOAP",
  auth: soapAuth(),
  minimumSupportedRelease: '0.5.0',
  logoUrl: "https://www.flowgear.net/wp-content/uploads/2019/03/soap-request.png",
  authors: ["x7airworker"],
  actions: [
    callMethod
  ],
  triggers: [],
});
