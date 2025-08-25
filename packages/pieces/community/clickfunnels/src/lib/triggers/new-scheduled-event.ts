import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_scheduled_event_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newScheduledEventTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_scheduled_event',
    displayName: 'New Scheduled Appointment',
    description: 'Triggers when a new appointment is scheduled.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace to monitor for new appointments.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on. 
    // It fetches the latest event to set a starting point.
    async onEnable(context) {
        const { subdomain, workspace_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/appointments/scheduled_events`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: { sort_order: 'desc' } // Get newest first
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const events = response.body;

        if (events.length > 0) {
            // Store the ID of the most recent event
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: events[0].id,
            });
        }
    },

    // onDisable runs once when the trigger is turned off.
    async onDisable(context) {
        // Clean up the store
        await context.store.delete(TRIGGER_DATA_STORE_KEY);
    },

    // run is executed on a schedule to check for new data.
    async run(context) {
        const { subdomain, workspace_id } = context.propsValue;
        const triggerData = await context.store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);

        const queryParams: QueryParams = {};
        if (triggerData?.last_fetched_id) {
            queryParams['after'] = triggerData.last_fetched_id.toString();
        }

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/appointments/scheduled_events`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newEvents = response.body;

        if (newEvents.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newEvents[newEvents.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newEvents;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 2,
        "public_id": "pSmykl",
        "workspace_id": 42000,
        "start_on": "2025-07-30T20:00:00.000Z",
        "end_on": "2025-07-30T20:30:00.000Z",
        "status": "scheduled",
        "max_invitees": 1,
        "order_id": null,
        "comments": "This is an example scheduled event for testing purposes.",
        "tzid": "America/Los_Angeles",
        "created_at": "2025-07-02T20:25:33.994Z",
        "updated_at": "2025-07-09T20:25:33.994Z",
        "event_type": {
            "name": "30 Minute Meeting"
        },
        "primary_contact": {
            "id": 41,
            "public_id": "GmtoZj",
            "email_address": "test-5679688decb1276eabf2@example.com",
            "first_name": "Mike",
            "last_name": "Fisher",
            "phone_number": "211.383.0524 x486"
        }
    }
});