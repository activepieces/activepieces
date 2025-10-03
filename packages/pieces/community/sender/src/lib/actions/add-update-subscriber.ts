import { createAction, Property } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { groupDropdown } from '../common/dropdown';
import { HttpMethod } from '@activepieces/pieces-common';

export const addUpdateSubscriber = createAction({
  auth: SenderAuth,
  name: 'addUpdateSubscriber',
  displayName: 'Add Update Subscriber',
  description: "Add a new subscriber or update an existing subscriber in Sender",
  props: {
    email: Property.ShortText({
      displayName: "Email",
      required: true,
      description: "Subscriber's email address",
    }),
    firstName: Property.ShortText({
      displayName: "First Name",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: "Last Name",
      required: false,
    }),
    phone: Property.ShortText({
      displayName: "Phone",
      required: false,
    }),
    groups: groupDropdown,
    triggerAutomation: Property.Checkbox({
      displayName: "Trigger Automation",
      description: "Whether to trigger the associated automation workflows for this subscriber",
      required: false,
      defaultValue: false,
    }),

  },
  async run({ auth, propsValue }) {
    const body: any = {
      email: propsValue.email,
    };
    if (propsValue.firstName) body.firstname = propsValue.firstName;
    if (propsValue.lastName) body.lastname = propsValue.lastName;
    if (propsValue.phone) body.phone = propsValue.phone;
    if (propsValue.groups) {
      body.groups = [propsValue.groups];
    }
      if (propsValue.triggerAutomation !== undefined) body.trigger_automation = propsValue.triggerAutomation;
    

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        "/subscribers",
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