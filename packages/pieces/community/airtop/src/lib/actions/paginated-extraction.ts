import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const paginatedExtraction = createAction({
  auth: airtopAuth,
  name: 'paginatedExtraction',
  displayName: 'Paginated Extraction',
  description: 'Submit a prompt that queries the content of a specific browser window and paginates through pages to return a list of results',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'A prompt providing the Airtop AI model with additional direction or constraints about the page and the details you want to extract from the page',
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
    const { sessionId, windowId, prompt, clientRequestId, costThresholdCredits, timeThresholdSeconds } = propsValue;

    const requestBody: any = {
      prompt,
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
      `/sessions/${sessionId}/windows/${windowId}/paginated-extraction`,
      undefined,
      requestBody
    );

    return response;
  },
});
