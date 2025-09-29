import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';
import { agentIdDropdown } from '../common/props';

export const makePhoneCall = createAction({
  auth: retellAiAuth,
  name: 'make_phone_call',
  displayName: 'Make Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents.',
  props: {
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description:
        'The number you own in E.164 format. Must be a number purchased from Retell or imported to Retell.',
      required: true,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description:
        'The number you want to call, in E.164 format. If using a number purchased from Retell, only US numbers are supported as destination.',
      required: true,
    }),
    overrideAgentId: agentIdDropdown('Agent'),
    overrideAgentVersion: Property.Number({
      displayName: 'Override Agent Version',
      description:
        'For this particular call, override the agent version used with this version. This does not bind the agent version to this number, this is for one time override.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'An arbitrary object for storage purpose only. You can put anything here like your internal customer id associated with the call.',
      required: false,
    }),
    dynamicVariables: Property.Object({
      displayName: 'Dynamic Variables',
      description:
        'Add optional dynamic variables in key value pairs of string that injects into your Response Engine prompt and tool description. Only applicable for Response Engine.',
      required: false,
    }),
    customSipHeaders: Property.Object({
      displayName: 'Custom SIP Headers',
      description: 'Add optional custom SIP headers to the call.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      fromNumber,
      toNumber,
      overrideAgentId,
      overrideAgentVersion,
      metadata,
      dynamicVariables,
      customSipHeaders,
    } = propsValue;

    // Validate phone numbers
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(fromNumber)) {
      throw new Error('From Number must be in E.164 format (e.g., +14157774444)');
    }
    
    if (!e164Regex.test(toNumber)) {
      throw new Error('To Number must be in E.164 format (e.g., +12137774445)');
    }

    const body: Record<string, unknown> = {
      from_number: fromNumber,
      to_number: toNumber,
    };

    if (overrideAgentId) {
      body['override_agent_id'] = overrideAgentId;
    }

    if (overrideAgentVersion !== undefined) {
      body['override_agent_version'] = overrideAgentVersion;
    }

    if (metadata) {
      body['metadata'] = metadata;
    }

    if (dynamicVariables) {
      body['retell_llm_dynamic_variables'] = dynamicVariables;
    }

    if (customSipHeaders) {
      body['custom_sip_headers'] = customSipHeaders;
    }

    return await retellAiApiCall({
      method: HttpMethod.POST,
      url: '/v2/create-phone-call',
      auth: auth,
      body,
    });
  },
});