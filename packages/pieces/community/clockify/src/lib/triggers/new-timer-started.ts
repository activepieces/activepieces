import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const newTimerStartedTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_timer_started',
  displayName: 'New Timer Started',
  description: 'Triggers when a new timer is started in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user (leave empty to monitor all users if you have admin rights)',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store }) => {
    await store.put('runningTimers', {});
  },
  onDisable: async () => {
    // Nothing to clean up
  },
  run: async ({ store, auth, propsValue }) => {
    const storedRunningTimers = await store.get('runningTimers') as Record<string, any> || {};
    let newTimers: any[] = [];

    let endpoint = `/workspaces/${propsValue.workspaceId}`;

    // If user ID is provided, check for that user only
    if (propsValue.userId) {
      endpoint += `/user/${propsValue.userId}/time-entries?in-progress=true`;
      const runningTimer = await makeRequest(auth as string, HttpMethod.GET, endpoint);

      if (runningTimer && runningTimer.length > 0) {
        const timer = runningTimer[0];
        // If this timer wasn't previously running, it's new
        if (!storedRunningTimers[propsValue.userId]) {
          newTimers.push(timer);
          storedRunningTimers[propsValue.userId] = timer.id;
        }
      } else {
        // No running timer, remove from stored timers
        if (storedRunningTimers[propsValue.userId]) {
          delete storedRunningTimers[propsValue.userId];
        }
      }
    } else {
      // Get all users in the workspace and check each one
      const users = await makeRequest(auth as string, HttpMethod.GET, `/workspaces/${propsValue.workspaceId}/users`);

      for (const user of users) {
        const userTimerEndpoint = `/workspaces/${propsValue.workspaceId}/user/${user.id}/time-entries?in-progress=true`;
        const runningTimer = await makeRequest(auth as string, HttpMethod.GET, userTimerEndpoint);

        if (runningTimer && runningTimer.length > 0) {
          const timer = runningTimer[0];
          // If this timer wasn't previously running, it's new
          if (!storedRunningTimers[user.id]) {
            newTimers.push(timer);
            storedRunningTimers[user.id] = timer.id;
          }
        } else {
          // No running timer, remove from stored timers
          if (storedRunningTimers[user.id]) {
            delete storedRunningTimers[user.id];
          }
        }
      }
    }

    await store.put('runningTimers', storedRunningTimers);

    return newTimers.map(timer => {
      return {
        id: timer.id,
        payload: timer,
      };
    });
  },
});
