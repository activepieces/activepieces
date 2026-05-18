import { createAction, Property } from '@activepieces/pieces-framework';
import { logrocketAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const requestHighlights = createAction({
  auth: logrocketAuth,
  name: 'requestHighlights',
  displayName: 'Request Highlights',
  description: 'Request session highlights for a user. Results will be sent to the webhook URL when ready.',
  props: {
    orgId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Your LogRocket organization ID (found in Settings > General Settings, or in your App ID before the slash)',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your LogRocket project ID (found in Settings > General Settings, or in your App ID after the slash)',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'The email of the user to get highlights for',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user from LogRocket.identify() calls',
      required: false,
    }),
    timeRangeStart: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start of the time range for sessions (optional)',
      required: false,
    }),
    timeRangeEnd: Property.DateTime({
      displayName: 'End Time',
      description: 'End of the time range for sessions (optional)',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL where highlights results will be posted when ready. You can get this from the "Highlights Ready" trigger.',
      required: true,
    }),
  },
  async run(context) {
    const { orgId, projectId, userEmail, userId, timeRangeStart, timeRangeEnd, webhookUrl } = context.propsValue;
    const apiKey = context.auth;

    if (!userEmail && !userId) {
      throw new Error('Either userEmail or userId must be provided');
    }

    const body: Record<string, unknown> = {
      webhookURL: webhookUrl,
    };

    if (userEmail) {
      body['userEmail'] = userEmail;
    }

    if (userId) {
      body['userID'] = userId;
    }

    if (timeRangeStart && timeRangeEnd) {
      const startMs = new Date(timeRangeStart).getTime();
      const endMs = new Date(timeRangeEnd).getTime();
      
      if (startMs >= endMs) {
        throw new Error('Start time must be before end time');
      }

      body['timeRange'] = {
        startMs,
        endMs,
      };
    } else if (timeRangeStart || timeRangeEnd) {
      throw new Error('Both start time and end time must be provided if using time range');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.logrocket.com/v1/orgs/${orgId}/apps/${projectId}/highlights/`,
        headers: {
          Authorization: `token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return response.body;
    } catch (error) {
      throw new Error(
        `Failed to request highlights: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
});

