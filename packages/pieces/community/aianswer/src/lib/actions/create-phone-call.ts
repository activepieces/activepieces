import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { aiAnswerAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { aiAnswerConfig } from '../common/models';

export const createPhoneCall = createAction({
  name: 'createPhoneCall',
  auth: aiAnswerAuth,
  displayName: 'Create Phone Call',
  description: 'Create a phone call to customer from Agent',
  audience: 'both',
  aiMetadata: { description: 'Immediately places an outbound phone call from an AI Answer agent to a destination phone number. Use when an agent should call a customer right now; for a future-dated call use the schedule call action instead. Requires a valid agent ID and an E.164-formatted number with country code (e.g. +919876543210); optional key-value details can be attached. Not idempotent — each call places a new phone call.', idempotent: false },
  props: {
    agentID: Property.ShortText({
      displayName: 'Agent ID',
      required: true,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'To Phone Number',
      description: 'Enter the phone number, along with country code, in format (e.g., +919876543210)',
      required: true,
    }),
    details: Property.Object({
      displayName: 'Details',
      description: 'Optional details with key-value pairs (e.g., customer_id, priority)',
      required: false,
    }),
  },
  async run(context) {
    const agentID = context.propsValue.agentID;
    const phoneNumber = context.propsValue.phoneNumber;
    const details = context.propsValue.details || {}; // Optional details

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${aiAnswerConfig.baseUrl}/v2/call_agent/${agentID}`,
      headers: {
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth.secret_text,
      },
      queryParams: {
        agent_id: agentID,
        to_number: phoneNumber,
      },
      body: {
        details, // Include details object in the request body
      },
    });

    return res.body;
  },
});
