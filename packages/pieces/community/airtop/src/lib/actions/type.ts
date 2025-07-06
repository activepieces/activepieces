import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const type = createAction({
  auth: airtopAuth,
  name: 'type',
  displayName: 'Type',
  description: 'Execute a type interaction in a specific browser window',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
    text: Property.LongText({
      displayName: 'Text to Type',
      description: 'The text to type into the browser window',
      required: true,
    }),
    clearInputField: Property.Checkbox({
      displayName: 'Clear Input Field',
      description: 'If true, and an HTML input field is active, clears the input field before typing the text',
      required: false,
      defaultValue: false,
    }),
    elementDescription: Property.ShortText({
      displayName: 'Element Description',
      description: 'A natural language description of where to type (e.g., "the search box", "username field"). The interaction will be aborted if the target element cannot be found.',
      required: false,
    }),
    pressEnterKey: Property.Checkbox({
      displayName: 'Press Enter Key',
      description: 'If true, simulates pressing the Enter key after typing the text',
      required: false,
      defaultValue: false,
    }),
    pressTabKey: Property.Checkbox({
      displayName: 'Press Tab Key',
      description: 'If true, simulates pressing the Tab key after typing the text. Note that the tab key will be pressed after the Enter key if both options are configured.',
      required: false,
      defaultValue: false,
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
      description: 'If true, Airtop AI will wait for the navigation to complete after typing',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { 
      sessionId, 
      windowId, 
      text, 
      clearInputField, 
      elementDescription, 
      pressEnterKey, 
      pressTabKey, 
      clientRequestId, 
      costThresholdCredits, 
      timeThresholdSeconds, 
      waitForNavigation 
    } = propsValue;

    const requestBody: any = {
      text,
    };

    // Add optional parameters if provided
    if (clearInputField !== undefined) {
      requestBody.clearInputField = clearInputField;
    }

    if (elementDescription) {
      requestBody.elementDescription = elementDescription;
    }

    if (pressEnterKey !== undefined) {
      requestBody.pressEnterKey = pressEnterKey;
    }

    if (pressTabKey !== undefined) {
      requestBody.pressTabKey = pressTabKey;
    }

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
      `/sessions/${sessionId}/windows/${windowId}/type`,
      undefined,
      requestBody
    );

    return response;
  },
});
