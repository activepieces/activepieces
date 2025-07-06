import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const clickElement = createAction({
  auth: airtopAuth,
  name: 'click Element',
  displayName: 'Click an Element',
  description: 'Execute a click interaction in a specific browser window',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
    elementDescription: Property.LongText({
      displayName: 'Element Description',
      description: 'A natural language description of the element to click (e.g., "The login button", "The submit form button")',
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
    waitForNavigation: Property.Checkbox({
      displayName: 'Wait for Navigation',
      description: 'If true, Airtop AI will wait for the navigation to complete after clicking the element',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { 
      sessionId, 
      windowId, 
      elementDescription, 
      clientRequestId, 
      costThresholdCredits, 
      timeThresholdSeconds, 
      waitForNavigation 
    } = propsValue;

    const requestBody: any = {
      elementDescription,
    };

    // Add optional parameters if provided
    if (clientRequestId) {
      requestBody.clientRequestId = clientRequestId;
    }

    if (costThresholdCredits !== undefined || timeThresholdSeconds !== undefined || waitForNavigation !== undefined) {
      requestBody.configuration = {};
      
      if (costThresholdCredits !== undefined) {
        requestBody.configuration.costThresholdCredits = costThresholdCredits;
      }
      
      if (timeThresholdSeconds !== undefined) {
        requestBody.configuration.timeThresholdSeconds = timeThresholdSeconds;
      }
      
      if (waitForNavigation !== undefined) {
        requestBody.configuration.waitForNavigation = waitForNavigation;
      }
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/sessions/${sessionId}/windows/${windowId}/click`,
      undefined,
      requestBody
    );

    return response;
  },
});
