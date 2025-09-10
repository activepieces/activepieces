import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import { openPhoneCommon, OpenPhoneCallSummaryResponse } from '../common';
import {
  phoneNumberDropdown,
  participantDropdown,
  callDropdown,
} from '../common/props';

export const getCallSummary = createAction({
  auth: openPhoneAuth,
  name: 'get_call_summary',
  displayName: 'Get Call Summary',
  description:
    'Retrieve an AI-generated summary of a specific call by ID. Call summaries are only available on OpenPhone Business plan.',
  props: {
    phoneNumberId: phoneNumberDropdown,
    participantNumber: participantDropdown,
    callId: callDropdown,
  },
  async run(context) {
    const { callId } = context.propsValue;
    const auth = context.auth;

    if (!callId || callId === 'manual' || callId === '') {
      throw new Error(
        'Please provide a valid Call ID in the format AC... or select a call from the dropdown'
      );
    }

    if (!callId.match(/^AC[a-zA-Z0-9]+$/)) {
      throw new Error(
        'Invalid call ID format. Call ID should start with "AC" followed by alphanumeric characters.'
      );
    }

    try {
      const response: OpenPhoneCallSummaryResponse =
        await openPhoneCommon.makeRequest<OpenPhoneCallSummaryResponse>(
          HttpMethod.GET,
          `/v1/call-summaries/${callId}`,
          auth
        );

      return response;
    } catch (error) {
      throw new Error(`Failed to get call summary: ${error}`);
    }
  },
});
