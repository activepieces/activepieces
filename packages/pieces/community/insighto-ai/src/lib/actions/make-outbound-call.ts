import { createAction, Property } from "@activepieces/pieces-framework";
import { WidgetDropdown } from "../common/dropdown";
import { InsightoAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";

export const MakeOutboundCall = createAction({
  auth: InsightoAuth,
  name: "make_outbound_call",
  displayName: "Make Outbound Call",
  description: "Initiate an outbound call via Insighto.ai using a specific widget.",
  props: {
    widgetId: WidgetDropdown,
    to: Property.ShortText({
      displayName: "To Number",
      description: "The phone number to call (E.164 format, e.g. 16501234567).",
      required: true,
    }),
    promptDynamicVariables: Property.Object({
      displayName: "Prompt Dynamic Variables",
      description:
        "Key-value pairs to pass as dynamic variables in the prompt (e.g. { 'name': 'Bob', 'appointment_day': 'tomorrow' }).",
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { widgetId, to, promptDynamicVariables } = propsValue;

    const body: Record<string, unknown> = {
      to,
    };

    if (promptDynamicVariables) {
      body["prompt_dynamic_variables"] = promptDynamicVariables;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/call/${widgetId}`,
      body
    );

    return response;
  },
});
