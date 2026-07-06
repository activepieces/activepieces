import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL, timeOpsClient } from '../common';

export const stopTimer = createAction({
  auth: timeOpsAuth,
  name: 'stop_timer',
  displayName: 'Stop Timer',
  description: 'Stop the currently running timer.',
  audience: 'both',
  aiMetadata: { description: 'Stops the currently running timer (open registration) for a given user in TimeOps, closing out the time entry. Use after Start Timer to finalize a live time entry; requires the user id. Not idempotent: it mutates the open registration, and a repeat call with no timer running has no entry to close.', idempotent: false },
  props: {
    userId: Property.Dropdown({
      displayName: 'User',
      description: 'The user to stop the timer for.',
      auth: timeOpsAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account.',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<
          { id: number; name: string }[]
        >({
          method: HttpMethod.GET,
          url: `${BASE_URL}/Users`,
          headers: {
            'x-api-key': (auth as { secret_text: string }).secret_text,
          },
        });

        return {
          disabled: false,
          options: response.body.map((user) => ({
            label: user.name ?? `User ${user.id}`,
            value: user.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { userId } = context.propsValue;

    return await timeOpsClient.makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/Registrations/stop/${userId}`,
      {}
    );
  },
});
