import { PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export { upsertContact } from "../actions/upsert-contact";
export { getContact } from "../actions/get-contact";
export { inboundMessage } from "../actions/inbound-message";
export { syncTimeline } from "../actions/sync-timeline";
export { syncWebhookStatus } from "../actions/sync-webhook-status";
export { sendSms } from "../actions/send-sms";
export { logEvent } from "../actions/log-event";

export const kodeProAuth = PieceAuth.CustomAuth({
  displayName: "Kode Pro API",
  description: "Connect to your Kode Pro dashboard",
  required: true,
  props: {
    apiUrl: PieceAuth.SecretText({
      displayName: "API URL",
      description: "Dashboard URL (e.g. https://app.kodepro.com)",
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: "API Key",
      description: "Your client API key",
      required: true,
    }),
    clientId: PieceAuth.SecretText({
      displayName: "Client ID",
      description: "Your client UUID",
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // The lookup endpoint returns 200 with { contact: null } for unmatched queries.
      // A 401 response (invalid API key) causes httpClient to throw.
      await httpClient.sendRequest({
        url: `${auth.apiUrl}/api/v1/contacts/lookup`,
        method: HttpMethod.GET,
        headers: {
          Authorization: `Bearer ${auth.apiKey}`,
          "X-Client-Id": auth.clientId,
        },
        queryParams: { phone: "+10000000000" },
      });
      return { valid: true };
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        return { valid: false, error: "Invalid API key" };
      }
      return { valid: false, error: "Unable to connect to Kode Pro dashboard" };
    }
  },
});

export type KodeProAuth = {
  apiUrl: string;
  apiKey: string;
  clientId: string;
};

export async function makeKodeProRequest(
  auth: KodeProAuth,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
) {
  return await httpClient.sendRequest({
    url: `${auth.apiUrl}/api/v1${endpoint}`,
    method,
    headers: {
      Authorization: `Bearer ${auth.apiKey}`,
      "X-Client-Id": auth.clientId,
      "Content-Type": "application/json",
    },
    body,
    queryParams,
  });
}
