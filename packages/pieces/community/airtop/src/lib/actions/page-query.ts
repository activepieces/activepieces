import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airtopAuth } from '../common/auth';
import { airtopApiCall } from '../common/client';
import { sessionId, windowId } from '../common/props';

export const pageQueryAction = createAction({
  name: 'page-query',
  auth: airtopAuth,
  displayName: 'Page Query',
  description: 'Query a page to extract data or ask a question given the data on the page.',
  props: {
    sessionId: sessionId,
    windowId: windowId,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The question or instruction for Airtop to answer about the current page.',
      required: true,
    }),
    clientRequestId: Property.ShortText({
      displayName: 'Client Request ID',
      description: 'An optional ID for your internal tracking.',
      required: false,
    }),
    costThresholdCredits: Property.Number({
      displayName: 'Cost Threshold (Credits)',
      description:
        'If specified, cancels the request if the credit threshold is exceeded. Set 0 to disable.',
      required: false,
    }),
    followPaginationLinks: Property.Checkbox({
      displayName: 'Follow Pagination Links',
      description:
        'If enabled, Airtop will attempt to load more content from pagination, scrolling, etc.',
      required: false,
    }),
    timeThresholdSeconds: Property.Number({
      displayName: 'Time Threshold (Seconds)',
      description:
        'If specified, cancels the request if time threshold is exceeded. Set 0 to disable.',
      required: false,
    }),
    configuration: Property.Object({
      displayName: 'Configuration',
      description: 'Optional request configuration (includeVisualAnalysis, outputSchema, scrape, etc).',
      required: false,
    }),
  },
  async run(context) {
    const {
      sessionId,
      windowId,
      prompt,
      clientRequestId,
      costThresholdCredits,
      followPaginationLinks,
      timeThresholdSeconds,
      configuration,
    } = context.propsValue;

    const body: Record<string, any> = { prompt };

    if (clientRequestId) {
      body['clientRequestId'] = clientRequestId;
    }

    const config: Record<string, any> = configuration ?? {};

    if (typeof costThresholdCredits === 'number') {
      config['costThresholdCredits'] = costThresholdCredits;
    }
    if (typeof followPaginationLinks === 'boolean') {
      config['followPaginationLinks'] = followPaginationLinks;
    }
    if (typeof timeThresholdSeconds === 'number') {
      config['timeThresholdSeconds'] = timeThresholdSeconds;
    }

    if (Object.keys(config).length > 0) {
      body['configuration'] = config;
    }

    const response = await airtopApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/sessions/${sessionId}/windows/${windowId}/page-query`,
      body,
    });

    return response;
  },
});
