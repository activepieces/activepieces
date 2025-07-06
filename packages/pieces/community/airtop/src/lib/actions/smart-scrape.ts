import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const smartScrape = createAction({
  auth: airtopAuth,
  name: 'smartScrape',
  displayName: 'Smart Scrape',
  description: 'Scrape a window and return the content as markdown',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
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
    const { sessionId, windowId, clientRequestId, costThresholdCredits, timeThresholdSeconds } = propsValue;

    const requestBody: any = {};

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
      `/sessions/${sessionId}/windows/${windowId}/scrape-content`,
      undefined,
      Object.keys(requestBody).length > 0 ? requestBody : undefined
    );

    return response;
  },
});
