import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpError } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';

const pollingStoreKey = 'toggl_new_time_entry_started_trigger';

type TimeEntry = {
    id: number;
    [key: string]: unknown;
}

export const newTimeEntryStarted = createTrigger({
    auth: togglTrackAuth,
    name: 'new_time_entry_started',
    displayName: 'New Time Entry Started',
    description: 'Fires when a time entry is started (a timer begins running).',
    props: {
        // No properties needed, this trigger monitors the user's current running timer.
    },
    sampleData: {
        "id": 1234567891,
        "workspace_id": 987654,
        "project_id": 123987456,
        "start": "2025-08-29T11:15:00Z",
        "duration": -1700543715, // A negative duration indicates a running timer
        "description": "Researching new API documentation",
        "at": "2025-08-29T11:15:00+00:00"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        // Get the currently running entry on enable, but don't fire for it.
        // This prevents the trigger from firing for a timer that was already running.
        const currentEntry = await getCurrentEntry(context.auth);
        await context.store.put(pollingStoreKey, { lastSeenId: currentEntry?.id ?? null });
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const { lastSeenId } = await context.store.get<{ lastSeenId: number | null }>(pollingStoreKey) ?? { lastSeenId: null };
        const currentEntry = await getCurrentEntry(context.auth);
        
        if (!currentEntry) {
            // No timer is running. If we were tracking one, reset the store.
            if (lastSeenId !== null) {
                await context.store.put(pollingStoreKey, { lastSeenId: null });
            }
            return [];
        }

        // A timer is running. Check if it's a new one.
        if (currentEntry.id !== lastSeenId) {
            await context.store.put(pollingStoreKey, { lastSeenId: currentEntry.id });
            return [currentEntry];
        }

        // It's the same timer we've already seen, so do nothing.
        return [];
    },
});

async function getCurrentEntry(apiToken: string): Promise<TimeEntry | null> {
    try {
        const response = await httpClient.sendRequest<TimeEntry>({
            method: HttpMethod.GET,
            url: `https://api.track.toggl.com/api/v9/me/time_entries/current`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
            },
        });
        return response.body;
    } catch (e) {
        // Toggl returns 404 when no timer is running.
        if (e instanceof HttpError && e.response.status === 404) {
            return null;
        }
        throw e;
    }
}