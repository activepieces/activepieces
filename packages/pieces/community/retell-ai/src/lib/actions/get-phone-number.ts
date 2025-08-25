import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';
import { retellAiCommon } from '../common/props';

export const getPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'get_phone_number',
  displayName: 'Get a Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI',
  props: {
    phone_number: retellAiCommon.phone_number,
  },
  async run(context) {
    const { phone_number } = context.propsValue;

    try {
      const response = await retellAiApi.get('/v2/get-phone-number', context.auth, { phone_number });
      
      return {
        success: true,
        phone_number: response.phone_number,
        phone_number_type: response.phone_number_type,
        phone_number_pretty: response.phone_number_pretty,
        inbound_agent_id: response.inbound_agent_id,
        outbound_agent_id: response.outbound_agent_id,
        inbound_agent_version: response.inbound_agent_version,
        outbound_agent_version: response.outbound_agent_version,
        area_code: response.area_code,
        nickname: response.nickname,
        inbound_webhook_url: response.inbound_webhook_url,
        last_modification_timestamp: response.last_modification_timestamp,
        message: 'Phone number details retrieved successfully',
        raw_response: response,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve phone number details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
