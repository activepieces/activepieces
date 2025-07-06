import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const hoverElement = createAction({
  auth: airtopAuth,
  name: 'hoverElement',
  displayName: 'Hover Element',
  description: 'Execute a hover interaction in a specific browser window',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
    elementDescription: Property.LongText({
      displayName: 'Element Description',
      description: 'A natural language description of where to hover (e.g., "the search box", "username field"). The interaction will be aborted if the target element cannot be found.',
      required: true,
    }),
    clientRequestId: Property.ShortText({
      displayName: 'Client Request ID',
      description: 'Optional client request ID for tracking',
      required: false,
    }),
    costThresholdCredits: Property.Number({
      displayName: 'Cost Threshold (Credits)',
      description: 'Credit threshold that will cause the operation to be cancelled if exceeded',
      required: false,
    }),
    timeThresholdSeconds: Property.Number({
      displayName: 'Time Threshold (Seconds)',
      description: 'Time threshold in seconds that will cause the operation to be cancelled if exceeded',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { sessionId, windowId, elementDescription, clientRequestId, costThresholdCredits, timeThresholdSeconds } = propsValue;

    const requestBody: any = {
      elementDescription,
    };

    // Add optional parameters if provided
    if (clientRequestId) {
      requestBody.clientRequestId = clientRequestId;
    }

    if (costThresholdCredits !== undefined || timeThresholdSeconds !== undefined) {
      requestBody.configuration = {};
      
      if (costThresholdCredits !== undefined) {
        requestBody.configuration.costThresholdCredits = costThresholdCredits;
      }
      
      if (timeThresholdSeconds !== undefined) {
        requestBody.configuration.timeThresholdSeconds = timeThresholdSeconds;
      }
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/sessions/${sessionId}/windows/${windowId}/hover`,
      undefined,
      requestBody
    );

    return response;
  },
});
