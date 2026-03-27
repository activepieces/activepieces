import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { kodeProAuth, makeKodeProRequest, KodeProAuth } from "../common";

export const syncWebhookStatus = createAction({
  auth: kodeProAuth,
  name: "sync_webhook_status",
  displayName: "Sync Webhook Status",
  description: "Sync webhook registration status for a provider.",
  props: {
    provider: Property.ShortText({
      displayName: "Provider",
      description: "The source provider (e.g. housecall_pro)",
      required: true,
    }),
    webhooks: Property.Array({
      displayName: "Webhooks",
      description: "Array of webhook objects with their current status",
      required: false,
    }),
    verified: Property.Checkbox({
      displayName: "Verified",
      description: "Whether the webhooks have been verified",
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      provider: propsValue["provider"],
    };

    if (propsValue["webhooks"]) body["webhooks"] = propsValue["webhooks"];
    if (propsValue["verified"] !== undefined) body["verified"] = propsValue["verified"];

    const response = await makeKodeProRequest(
      auth as unknown as KodeProAuth,
      "/webhooks/sync-status",
      HttpMethod.POST,
      body
    );

    return response.body;
  },
});
