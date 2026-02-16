import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { newRecording } from "./lib/triggers/new-recording";
import { newCdr } from "./lib/triggers/new-cdr";
import { newIncomingCall } from "./lib/triggers/new-incoming-call";
import { newOutgoingCall } from "./lib/triggers/new-outgoing-call";
import { newVoicemail } from "./lib/triggers/new-voicemail";
import { newSms } from "./lib/triggers/new-sms";
import { createContactAction } from "./lib/actions/create-contact";
import { doNotDisturbAction } from "./lib/actions/do-not-disturb";
import { initiateCallAction } from "./lib/actions/initiate-call";
import { sendSmsAction } from "./lib/actions/send-sms";
import { updateCdrAction } from "./lib/actions/update-cdr";

export const connectucAuth = PieceAuth.OAuth2({
  authUrl: "https://auth.uc-technologies.com/oauth2/authorize",
  tokenUrl: "https://auth.uc-technologies.com/oauth2/token",
  required: true,
  scope: [],
  validate: async ({ auth }) => {
    try {
      console.log("Validating ConnectUC OAuth2 credentials...");
      console.log("Access token:", (auth as OAuth2PropertyValue).access_token);

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: "https://auth.uc-technologies.com/oauth2/userinfo",
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (auth as OAuth2PropertyValue).access_token,
        },
      });

      console.log("Response status:", response.status);
      console.log("Response body:", response.body);

      if (response.status === 200) {
        return { valid: true };
      }

      return {
        valid: false,
        error: "Failed to validate ConnectUC credentials"
      };
    } catch (error: any) {
      console.log("Validation error:", error);
      console.log("Error response:", error.response);

      if (error.response?.status === 401) {
        return {
          valid: false,
          error: "Invalid or expired access token. Please reconnect your ConnectUC account."
        };
      }

      return {
        valid: false,
        error: `Connection validation failed: ${error.message || "Unknown error occurred"}`
      };
    }
  },
});

export const connectuc = createPiece({
  displayName: "ConnectUC",
  auth: connectucAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cuc-media.s3.us-east-1.amazonaws.com/cuc_logo_120x120.png",
  authors: [],
  actions: [createContactAction, doNotDisturbAction, initiateCallAction, sendSmsAction, updateCdrAction],
  triggers: [newRecording, newCdr, newIncomingCall, newOutgoingCall, newVoicemail, newSms],
});
