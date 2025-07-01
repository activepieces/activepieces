import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const typeAction = createAction({
  name: 'type',
  auth: airtopAuth,
  displayName: 'Type Text',
  description: 'Type into a browser window at the specified field.',
  props: {
    sessionId: sessionId,
    windowId: windowId,
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to type into the browser window',
      required: true,
    }),
    clearInputField: Property.Checkbox({
      displayName: 'Clear Input Field Before Typing',
      required: false,
      defaultValue: false,
    }),
    clientRequestId: Property.ShortText({
      displayName: 'Client Request ID',
      required: false,
    }),
    elementDescription: Property.ShortText({
      displayName: 'Element Description',
      description: 'Natural language description of where to type (e.g. "username field", "search box")',
      required: false,
    }),
    pressEnterKey: Property.Checkbox({
      displayName: 'Press Enter After Typing',
      required: false,
      defaultValue: false,
    }),
    pressTabKey: Property.Checkbox({
      displayName: 'Press Tab After Typing',
      required: false,
      defaultValue: false,
    }),
    waitForNavigation: Property.Checkbox({
      displayName: 'Wait for Navigation',
      description: 'Wait for page navigation to complete after typing.',
      required: false,
      defaultValue: false,
    }),
    costThresholdCredits: Property.Number({
      displayName: 'Cost Threshold (Credits)',
      description:
        'Cancel if the credit threshold is exceeded. Set to 0 to disable.',
      required: false,
    }),
    timeThresholdSeconds: Property.Number({
      displayName: 'Time Threshold (Seconds)',
      description:
        'Cancel if the request exceeds this time. Set to 0 to disable.',
      required: false,
    }),
    configuration: Property.Object({
      displayName: 'Configuration',
      description: 'Optional configuration object (e.g. visualAnalysis, scroll config, etc.)',
      required: false,
    }),
  },
  async run(context) {
    const {
      sessionId,
      windowId,
      text,
      elementDescription,
      clearInputField,
      pressEnterKey,
      pressTabKey,
      clientRequestId,
      waitForNavigation,
      costThresholdCredits,
      timeThresholdSeconds,
      configuration,
    } = context.propsValue;

    const body: Record<string, any> = { text };

    if (elementDescription) body['elementDescription'] = elementDescription;
    if (clearInputField !== undefined) body['clearInputField'] = clearInputField;
    if (pressEnterKey !== undefined) body['pressEnterKey'] = pressEnterKey;
    if (pressTabKey !== undefined) body['pressTabKey'] = pressTabKey;
    if (clientRequestId) body['clientRequestId'] = clientRequestId;

    const config: Record<string, any> = configuration ? { ...configuration } : {};

    if (waitForNavigation) config['waitForNavigation'] = true;
    if (typeof costThresholdCredits === 'number') config['costThresholdCredits'] = costThresholdCredits;
    if (typeof timeThresholdSeconds === 'number') config['timeThresholdSeconds'] = timeThresholdSeconds;

    if (Object.keys(config).length > 0) {
      body['configuration'] = config;
    }

    const response = await airtopApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/sessions/${sessionId}/windows/${windowId}/type`,
      body,
    });

    return response;
  },
});
