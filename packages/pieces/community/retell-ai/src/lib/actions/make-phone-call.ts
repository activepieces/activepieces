import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { agentIdDropdown } from '../common/props';
import { retellSchemas } from '../common/schemas';

export const makePhoneCall = createAction({
  auth: retellAiAuth,
  name: 'make_phone_call',
  classification: 'WRITE',
  displayName: 'Make Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents.',
  audience: 'human',
  aiMetadata: {
    description:
      'Places an outbound phone call from a Retell number, handled by a Retell voice agent. Billed per minute; each run dials again.',
    idempotent: false,
  },
  props: {
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'The number you own in E.164 format. Must be a number purchased from Retell or imported to Retell.',
      required: true,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description:
        'The number you want to call, in E.164 format. If using a number purchased from Retell, only US numbers are supported as destination.',
      required: true,
    }),
    overrideAgentId: agentIdDropdown({ displayName: 'Agent' }),
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
        'Key-value pairs for the agent prompt. Values are sent as text.',
      required: false,
    }),
    customSipHeaders: Property.Object({
      displayName: 'Custom SIP Headers',
      description: 'Add optional custom SIP headers to the call.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.rawCall,
  async run({ propsValue, auth }) {
    const body: Record<string, unknown> = {
      from_number: retellInput.e164({ value: propsValue.fromNumber, label: 'From Number' }),
      to_number: retellInput.e164({ value: propsValue.toNumber, label: 'To Number' }),
    };
    const agentId = retellInput.optionalText(propsValue.overrideAgentId);
    if (agentId !== undefined) {
      body['override_agent_id'] = agentId;
    }
    const version = retellInput.optionalInteger({
      value: propsValue.overrideAgentVersion,
      label: 'Override Agent Version',
      min: 0,
    });
    if (version !== undefined) {
      body['override_agent_version'] = version;
    }
    const metadata = retellInput.objectValue({ value: propsValue.metadata, label: 'Metadata' });
    if (metadata !== undefined) {
      body['metadata'] = metadata;
    }
    const variables = retellInput.stringMap({ value: propsValue.dynamicVariables, label: 'Dynamic Variables' });
    if (variables !== undefined) {
      body['retell_llm_dynamic_variables'] = variables;
    }
    const sipHeaders = retellInput.stringMap({ value: propsValue.customSipHeaders, label: 'Custom SIP Headers' });
    if (sipHeaders !== undefined) {
      body['custom_sip_headers'] = sipHeaders;
    }
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/v2/create-phone-call',
      body,
    });
  },
});
