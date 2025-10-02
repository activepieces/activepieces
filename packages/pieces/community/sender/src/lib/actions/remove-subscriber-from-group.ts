import { createAction, Property } from "@activepieces/pieces-framework";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { groupDropdown, subscriberDropdown } from "../common/dropdown";

export const removeSubscriberFromGroup = createAction({
  auth: SenderAuth,
  name: "removeSubscriberFromGroup",
  displayName: "Remove Subscriber from Group",
  description: "Remove one or more subscribers from a selected group in Sender",

  props: {
    groupId: groupDropdown, 
    subscribers: subscriberDropdown, 
  },

  async run({ auth, propsValue }) {
    const body: any = {
      subscribers: propsValue.subscribers, 
    };

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.DELETE,
        `/subscribers/groups/${propsValue.groupId}`,
        body
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
