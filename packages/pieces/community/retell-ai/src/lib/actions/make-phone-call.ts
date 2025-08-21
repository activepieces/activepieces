import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi, retellAiCommon } from '../common';

export const makePhoneCall = createAction({
  auth: retellAiAuth,
  name: 'make_phone_call',
  displayName: 'Make a Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents',
  props: {
    from_number: retellAiCommon.from_number,
    to_number: retellAiCommon.to_number,
    agent_id: retellAiCommon.agent_id,
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata to attach to the call',
      required: false,
    }),
    retell_llm_dynamic_variables: Property.Object({
      displayName: 'Dynamic Variables',
      description: 'Dynamic variables to pass to the Retell LLM',
      required: false,
    }),
    custom_sip_headers: Property.Object({
      displayName: 'Custom SIP Headers',
      description: 'Custom SIP headers for the call',
      required: false,
    }),
    opt_out_sensitive_data_storage: Property.Checkbox({
      displayName: 'Opt Out Sensitive Data Storage',
      description: 'Opt out of storing sensitive data',
      required: false,
      defaultValue: false,
    }),
    opt_in_signed_url: Property.Checkbox({
      displayName: 'Opt In Signed URL',
      description: 'Opt in to receive signed URLs for recordings and logs',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      from_number,
      to_number,
      agent_id,
      metadata,
      retell_llm_dynamic_variables,
      custom_sip_headers,
      opt_out_sensitive_data_storage,
      opt_in_signed_url,
    } = context.propsValue;

    const payload = {
      from_number,
      to_number,
      agent_id,
      ...(metadata && { metadata }),
      ...(retell_llm_dynamic_variables && { retell_llm_dynamic_variables }),
      ...(custom_sip_headers && { custom_sip_headers }),
      ...(opt_out_sensitive_data_storage !== undefined && { opt_out_sensitive_data_storage }),
      ...(opt_in_signed_url !== undefined && { opt_in_signed_url }),
    };

    const response = await retellAiApi.post('/v2/create-phone-call', context.auth, payload);
    return response;
  },
});
