import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { aiAnswerAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { aiAnswerConfig } from '../common/models';

export const scheduleCallAgent = createAction({
  name: 'scheduleCallAgent',
  auth: aiAnswerAuth,
  displayName: 'Schedule Call Agent',
  description: 'Schedule a call with an agent',
  props: {
    agentID: Property.ShortText({
      displayName: 'Agent ID',
      required: true,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: true,
    }),
    executionTime: Property.ShortText({
      displayName: 'Execution Time',
      description: 'Time to schedule the call in YYYY-MM-DD HH:MM:SS format.',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone of the scheduled call (e.g., Asia/Calcutta)',
      required: true,
    }),
    prospectDetails: Property.Object({
      displayName: 'Prospect Details',
      description: 'Optional prospect details with key-value pairs (e.g., customer_id, priority)',
      required: false,
    }),
  },
  async run(context) {
    const agentID = context.propsValue.agentID;
    const phoneNumber = context.propsValue.phoneNumber;
    const executionTime = context.propsValue.executionTime;
    const timezone = context.propsValue.timezone;
    const prospectDetails = context.propsValue.prospectDetails || {}; // Optional prospect details

    const requestBody = {
      phone_number: phoneNumber,
      execution_time: executionTime,
      timezone: timezone,
      prospect_details: {
        details: prospectDetails, // Nested details object with custom key-value pairs
      },
    };

    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${aiAnswerConfig.baseUrl}/v2/schedule_call_agent/${agentID}`,
      headers: {
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth,
      },
      queryParams: {
        agent_id: agentID
      },
      body: requestBody,
    });

    return res.body;
  },
});


