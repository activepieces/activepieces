import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_contact_identified_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newContactIdentifiedTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_contact_identified',
    displayName: 'New Contact Identified',
    description: 'Triggers when a new contact is created (identified by email or phone).',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace to monitor for new contacts.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    async onEnable(context) {
        const { subdomain, workspace_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/contacts`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: { 'sort_order': 'desc' }
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const contacts = response.body;

        if (contacts.length > 0) {
            // Store the ID of the most recent contact
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: contacts[0].id,
            });
        }
    },

    // onDisable runs once when the trigger is turned off.
    async onDisable(context) {
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
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/contacts`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newContacts = response.body;

        if (newContacts.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newContacts[newContacts.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newContacts;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 44,
        "public_id": "ZrhtKn",
        "workspace_id": 42000,
        "anonymous": null,
        "email_address": "test-90baf22d1540ba534bd6@example.com",
        "first_name": "Burl",
        "last_name": "Feest",
        "phone_number": "883.927.5304",
        "time_zone": "Pacific Time (US & Canada)",
        "uuid": "1f5c034b-5eae-4c61-ad8f-87eb2957e198",
        "unsubscribed_at": null,
        "last_notification_email_sent_at": null,
        "fb_url": "https://www.facebook.com/example",
        "twitter_url": "https://twitter.com/example",
        "instagram_url": null,
        "linkedin_url": "https://www.linkedin.com/in/example",
        "website_url": "https://example.com",
        "created_at": "2025-06-16T20:25:34.604Z",
        "updated_at": "2025-06-16T20:25:34.604Z",
        "tags": [
            {
                "id": 46,
                "public_id": "sYgiyk",
                "name": "Example Tag",
                "color": "#49523e",
                "applied_at": "2025-06-16T20:26:00.000Z"
            }
        ],
        "custom_attributes": {
            "CustomKey": "MyText"
        }
    }
});