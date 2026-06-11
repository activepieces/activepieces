import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../auth';
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
  audience: 'both',
  aiMetadata: { description: 'Retrieves the AI-generated summary of a single call identified by its call ID (format AC...). Choose this to fetch the post-call summary text for a known call. Requires a valid call ID and an OpenPhone Business plan (summaries are unavailable otherwise). Idempotent read-only lookup.', idempotent: true },
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
