import { createAction, Property } from '@activepieces/pieces-framework';
import { logrocketAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const identifyUser = createAction({
  auth: logrocketAuth,
  name: 'identifyUser',
  displayName: 'Identify User',
  description: 'Create or update user information and traits in LogRocket to contextualize user behavior.',
  props: {
    orgId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Your LogRocket organization ID (found in Settings > General Settings, or in your App ID before the slash)',
      required: true,
    }),
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'Your LogRocket app/project ID (found in Settings > General Settings, or in your App ID after the slash)',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier for the user',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The user\'s name (max 1024 characters)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The user\'s email address (max 1024 characters)',
      required: false,
    }),
    timestamp: Property.DateTime({
      displayName: 'Timestamp',
      description: 'Unix timestamp in milliseconds indicating when this data was collected (optional)',
      required: false,
    }),
    traits: Property.Object({
      displayName: 'Traits',
      description: 'User traits as key-value pairs (e.g., {"plan": "free", "age": 43}). Values will be converted to strings.',
      required: false,
    }),
  },
  async run(context) {
    const { orgId, appId, userId, name, email, timestamp, traits } = context.propsValue;
    const apiKey = context.auth;

    const body: Record<string, unknown> = {};

    if (name) {
      body['name'] = name;
    }

    if (email) {
      body['email'] = email;
    }

    if (timestamp) {
      body['timestamp'] = new Date(timestamp).getTime();
    }

    if (traits) {
      body['traits'] = traits;
    }

    if (Object.keys(body).length === 0) {
      throw new Error('At least one of name, email, timestamp, or traits must be provided');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://api.logrocket.com/v1/orgs/${orgId}/apps/${appId}/users/${userId}`,
        headers: {
          Authorization: `token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return response.body;
    } catch (error) {
      throw new Error(
        `Failed to identify user: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
});

