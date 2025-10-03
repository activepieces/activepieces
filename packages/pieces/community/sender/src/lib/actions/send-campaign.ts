import { createAction, Property } from "@activepieces/pieces-framework";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { campaignDropdown } from "../common/dropdown";

export const sendCampaign = createAction({
  auth: SenderAuth,
  name: "sendCampaign",
  displayName: "Send Campaign",
  description: "Trigger sending of a drafted campaign to its recipients",

  props: {
    campaignId: campaignDropdown,
  },

  async run({ auth, propsValue }) {
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        `/campaigns/${propsValue.campaignId}/send`
      );
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      throw new Error(`Sender API error: ${err.message}`);
    }
  },
});
