import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { listNotificationSoundsOutputSchema } from '../output-schemas';

export const listNotificationSounds = createAction({
  auth: pushoverAuth,
  name: 'list_notification_sounds',
  classification: 'READ',
  displayName: 'List Notification Sounds',
  description: 'List the notification sound identifiers Pushover accepts',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every sound identifier Pushover accepts, each with its human-readable name. Call it to resolve a sound before setting the Sound parameter of Send Push Message instead of guessing an identifier; omit the sound entirely to leave the recipient device default in place. Takes no input. Safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: listNotificationSoundsOutputSchema,
  async run({ auth }) {
    const response = await pushoverApiCall<SoundsResponse>({
      method: HttpMethod.GET,
      resourceUri: '/sounds.json',
      queryParams: { token: auth.props.api_token },
    });
    const sounds = Object.entries(response.sounds ?? {}).map(([id, name]) => ({
      id,
      name,
    }));

    return {
      sounds,
      count: sounds.length,
      status: response.status,
      request: response.request,
    };
  },
});

type SoundsResponse = {
  sounds: Record<string, string>;
  status: number;
  request: string;
};
