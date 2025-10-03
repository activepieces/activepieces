import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { groupDropdown, subscriberDropdown } from '../common/dropdown';

export const addSubscriberToGroup = createAction({
  auth: SenderAuth,
  name: "addSubscriberToGroup",
  displayName: "Add Subscriber to Group",
  description: "Add one or more subscribers to a selected group in Sender",
  props: {
    groupId: groupDropdown,
    subscribers: subscriberDropdown,
    triggerAutomation: Property.Checkbox({
      displayName: "Trigger Automation",
      required: false,
      defaultValue: true,
      description: "Whether to trigger automation workflows for these subscribers",
    }),
  },

  async run({ auth, propsValue }) {
    const body: any = {
      subscribers: propsValue.subscribers,
      trigger_automation: propsValue.triggerAutomation,
    };

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
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