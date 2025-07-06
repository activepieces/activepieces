import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airtopAuth } from '../common/auth';
import { makeRequest } from '../common';
import { sessionIdDropdown, windowIdDropdown } from '../common/props';

export const pageQuery = createAction({
  auth: airtopAuth,
  name: 'pageQuery',
  displayName: 'Page Query',
  description: 'Submit a prompt that queries the content of a specific browser window',
  props: {
    sessionId: sessionIdDropdown,
    windowId: windowIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The prompt to submit about the content in the browser window',
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
    followPaginationLinks: Property.Checkbox({
      displayName: 'Follow Pagination Links',
      description: 'Make a best effort attempt to load more content items by following pagination links, clicking controls to load more content, utilizing infinite scrolling, etc.',
      required: false,
      defaultValue: false,
    }),
    timeThresholdSeconds: Property.Number({
      displayName: 'Time Threshold (Seconds)',
      description: 'Time threshold in seconds that will cause the operation to be cancelled if exceeded',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { 
      sessionId, 
      windowId, 
      prompt, 
      clientRequestId, 
      costThresholdCredits, 
      followPaginationLinks, 
      timeThresholdSeconds 
    } = propsValue;

    const requestBody: any = {
      prompt,
    };

    // Add optional parameters if provided
    if (clientRequestId) {
      requestBody.clientRequestId = clientRequestId;
    }

    if (costThresholdCredits !== undefined || followPaginationLinks !== undefined || timeThresholdSeconds !== undefined) {
      requestBody.configuration = {};
      
      if (costThresholdCredits !== undefined) {
        requestBody.configuration.costThresholdCredits = costThresholdCredits;
      }
      
      if (followPaginationLinks !== undefined) {
        requestBody.configuration.followPaginationLinks = followPaginationLinks;
      }
      
      if (timeThresholdSeconds !== undefined) {
        requestBody.configuration.timeThresholdSeconds = timeThresholdSeconds;
      }
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/sessions/${sessionId}/windows/${windowId}/page-query`,
      undefined,
      requestBody
    );

    return response;
  },
});
