import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const makeAPhoneCall = createAction({
  auth: RetllAiAuth,
  name: 'makeAPhoneCall',
  displayName: 'Make a Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents',
  props: {
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'The phone number to call from (must be a valid Retell AI phone number)',
      required: true,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description: 'The phone number to call (in E.164 format, e.g., +1234567890)',
      required: true,
    }),
    overrideAgentId: Property.ShortText({
      displayName: 'Override Agent ID',
      description: 'The ID of the Retell AI agent to use for this call',
      required: true,
    }),
    overrideAgentVersion: Property.Number({
      displayName: 'Override Agent Version',
      description: 'Version of the agent to use',
      required: false,
    }),
    retellLlmDynamicVariables: Property.Object({
      displayName: 'Dynamic Variables',
      description: 'Dynamic variables to pass to the agent (JSON object)',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the call (JSON object)',
      required: false,
    }),
    customSipHeaders: Property.Object({
      displayName: 'Custom SIP Headers',
      description: 'Custom SIP headers for the call (JSON object)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      from_number: propsValue.fromNumber,
      to_number: propsValue.toNumber,
      override_agent_id: propsValue.overrideAgentId,
    };

    if (propsValue.overrideAgentVersion) {
      body.override_agent_version = propsValue.overrideAgentVersion;
    }

    if (propsValue.retellLlmDynamicVariables) {
      body.retell_llm_dynamic_variables = propsValue.retellLlmDynamicVariables;
    }

    if (propsValue.metadata) {
      body.metadata = propsValue.metadata;
    }

    if (propsValue.customSipHeaders) {
      body.custom_sip_headers = propsValue.customSipHeaders;
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/v2/create-phone-call',
      body
    );

    return response;
  },
});