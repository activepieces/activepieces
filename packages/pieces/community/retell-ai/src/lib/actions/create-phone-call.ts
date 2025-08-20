import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const createPhoneCallAction = createAction({
  auth: retellAiAuth,
  name: 'create_phone_call',
  displayName: 'Make a Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents.',
  props: {
    from_number: Property.ShortText({
      displayName: 'From Number',
      description: 'The number you own in E.164 format. Must be a number purchased from or imported to Retell.',
      required: true,
      // Example: "+14157774444"
    }),
    to_number: Property.ShortText({
      displayName: 'To Number',
      description: 'The number you want to call, in E.164 format.',
      required: true,
      // Example: "+12137774445"
    }),
    override_agent_id: Property.ShortText({
      displayName: 'Override Agent ID',
      description: 'For this particular call, override the agent used with this agent id.',
      required: false,
    }),
    override_agent_version: Property.Number({
        displayName: 'Override Agent Version',
        description: 'For this particular call, override the agent version used with this version.',
        required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'An arbitrary object for storage purposes. You can attach data like your internal customer ID to the call.',
      required: false,
    }),
    retell_llm_dynamic_variables: Property.Json({
        displayName: 'Retell LLM Dynamic Variables',
        description: 'Optional dynamic variables that inject into your Response Engine prompt and tool description.',
        required: false,
    }),
    custom_sip_headers: Property.Json({
        displayName: 'Custom SIP Headers',
        description: 'Optional custom SIP headers to add to the call.',
        required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Construct the request body, removing any undefined optional properties
    const body = {
        from_number: propsValue.from_number,
        to_number: propsValue.to_number,
        override_agent_id: propsValue.override_agent_id,
        override_agent_version: propsValue.override_agent_version,
        metadata: propsValue.metadata,
        retell_llm_dynamic_variables: propsValue.retell_llm_dynamic_variables,
        custom_sip_headers: propsValue.custom_sip_headers,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${retellAiCommon.baseUrl}/v2/create-phone-call`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });

    return response.body;
  },
});
