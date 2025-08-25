import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const makePhoneCall = createAction({
  auth: retellAiAuth,
  name: 'makePhoneCall',
  displayName: 'Make a Phone Call',
  description: 'Initiate a new outbound phone call using Retell AI agents.',
  props: retellCommon.newPhoneCallProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      retellCommon.newPhoneCallSchema
    );

    const {
      fromNumber,
      toNumber,
      overrideAgentId,
      overrideAgentVersion,
      metadata,
    } = propsValue;

    const customSIPHeaders = propsValue.customSIPHeaders
      ? Object.fromEntries(
          Object.entries(propsValue.customSIPHeaders).map(([key, value]) => [
            key,
            String(value),
          ])
        )
      : undefined;

    return retellCommon.createPhoneCall({
      apiKey,
      fromNumber,
      toNumber,
      overrideAgentId,
      overrideAgentVersion,
      metadata,
      customSIPHeaders,
    });
  },
});
