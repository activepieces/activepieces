import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpError } from "@activepieces/pieces-common";
import { connectucApiCall, formatApiError } from "./lib/common/api-helpers";
import { newRecording } from "./lib/triggers/new-recording";
import { newCallTranscription } from "./lib/triggers/new-call-transcription";
import { newCallSummary } from "./lib/triggers/new-call-summary";
import { newCdr } from "./lib/triggers/new-cdr";
import { newIncomingCall } from "./lib/triggers/new-incoming-call";
import { newOutgoingCall } from "./lib/triggers/new-outgoing-call";
import { newVoicemail } from "./lib/triggers/new-voicemail";
import { newSms } from "./lib/triggers/new-sms";
import { createContactAction } from "./lib/actions/create-contact";
import { doNotDisturbAction } from "./lib/actions/do-not-disturb";
import { findCdrAction } from "./lib/actions/find-cdr";
import { initiateCallAction } from "./lib/actions/initiate-call";
import { sendSmsAction } from "./lib/actions/send-sms";
import { updateCdrAction } from "./lib/actions/update-cdr";

export const connectucAuth = PieceAuth.OAuth2({
  authUrl: "https://auth.uc-technologies.com/oauth2/authorize",
  tokenUrl: "https://auth.uc-technologies.com/oauth2/token",
  required: true,
  scope: ['offline_access'],
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: "https://auth.uc-technologies.com/oauth2/userinfo",
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (auth as OAuth2PropertyValue).access_token,
        },
      });

      if (response.status === 200) {
        return validateApiAccess((auth as OAuth2PropertyValue).access_token);
      }

      return {
        valid: false,
        error: "Failed to validate ConnectUC credentials"
      };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 401) {
        return {
          valid: false,
          error: "Invalid or expired access token. Please reconnect your ConnectUC account."
        };
      }

      return {
        valid: false,
        error: `Connection validation failed: ${err.message ?? "Unknown error occurred"}`
      };
    }
  },
});

async function validateApiAccess(accessToken: string): Promise<{ valid: true } | { valid: false; error: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), API_ACCESS_CHECK_TIMEOUT_MS);
  });
  const probe = connectucApiCall({ accessToken, endpoint: '/activepieces/domains', method: HttpMethod.GET, timeout: API_ACCESS_CHECK_TIMEOUT_MS })
    .then(() => undefined, (error: unknown) => error);
  const error = await Promise.race([probe, deadline]);
  clearTimeout(timer);
  if (error instanceof HttpError && error.response.status === 401) {
    return {
      valid: false,
      error: `ConnectUC signed you in, but its API rejected this account (${formatApiError(error)}). Check with ConnectUC that this account has API access.`,
    };
  }
  return { valid: true };
}

export const connectuc = createPiece({
  displayName: "ConnectUC",
  auth: connectucAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/connectuc.png",
  authors: ['dranes'],
  actions: [createContactAction, doNotDisturbAction, findCdrAction, initiateCallAction, sendSmsAction, updateCdrAction],
  triggers: [newRecording, newCallTranscription, newCallSummary, newCdr, newIncomingCall, newOutgoingCall, newVoicemail, newSms],
});

const API_ACCESS_CHECK_TIMEOUT_MS = 10000;
