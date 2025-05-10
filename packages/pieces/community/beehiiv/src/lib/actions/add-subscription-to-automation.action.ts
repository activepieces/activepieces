import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { BEEHIIV_API_URL } from "../common/constants";
import { beehiivAuth } from "../../index";

export const addSubscriptionToAutomationAction = createAction({
  auth: beehiivAuth,
  name: 'add_subscription_to_automation',
  displayName: 'Add Subscription to Automation',
  description: 'Adds an existing subscriber to an automation flow. Requires the automation to have an "Add by API" trigger.',
  props: {
    publicationId: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The ID of the publication.',
      required: true,
    }),
    automationId: Property.ShortText({
      displayName: 'Automation ID',
      description: 'The ID of the automation.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Subscriber Email',
      description: 'The email address of the subscriber. Provide either Email or Subscription ID.',
      required: false,
    }),
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The ID of the subscription. Provide either Email or Subscription ID.',
      required: false,
    }),
    double_opt_override: Property.ShortText({
        displayName: 'Double Opt-in Override',
        description: 'Override publication double-opt settings for this subscription (e.g., "on").',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const publicationId = propsValue['publicationId'];
    const automationId = propsValue['automationId'];

    const body: Record<string, unknown> = {};
    if (propsValue['email']) {
      body['email'] = propsValue['email'];
    }
    if (propsValue['subscription_id']) {
      body['subscription_id'] = propsValue['subscription_id'];
    }
    if (propsValue['double_opt_override']) {
      body['double_opt_override'] = propsValue['double_opt_override'];
    }

    if (!body['email'] && !body['subscription_id']) {
        throw new Error('Either Subscriber Email or Subscription ID must be provided.');
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publicationId}/automations/${automationId}/journeys`,
      headers: {
        'Authorization': `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });
  },
});
