import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createRecordAction } from "./lib/actions/create-record";

export const oracleFusionAuth = PieceAuth.CustomAuth({
    description: "Authenticate with Oracle Fusion Cloud ERP using Basic Auth.",
    props: {
        base_url: Property.ShortText({
            displayName: "Base URL",
            description: "e.g. https://fa-eqjz-saasfaprod1.fa.ocs.oraclecloud.com",
            required: true,
        }),
        username: Property.ShortText({
            displayName: "Username",
            required: true,
        }),
        // FIX: Changed Property.SecretText to PieceAuth.SecretText
        password: PieceAuth.SecretText({
            displayName: "Password",
            required: true,
        }),
    },
    required: true,
});

export const oracleFusionErp = createPiece({
  displayName: "Oracle Fusion Cloud ERP",
  auth: oracleFusionAuth,
  minimumSupportedRelease: "0.30.0",
  logoUrl: "https://cdn.activepieces.com/pieces/oracle-fusion-erp.png",
  authors: [], 
  actions: [
    createRecordAction, 
  ],
  triggers: [],
});