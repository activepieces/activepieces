import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_form_submission_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newFormSubmissionTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_form_submission',
    displayName: 'New Form Submission',
    description: 'Triggers when a form is submitted in a workspace.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        workspace_id: Property.Number({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace to monitor for new form submissions.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    // It fetches the latest submission to set a starting point.
    async onEnable(context) {
        const { subdomain, workspace_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/form_submissions`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: { sort_order: 'desc' } // Get newest first
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const submissions = response.body;

        if (submissions.length > 0) {
            // Store the ID of the most recent submission
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: submissions[0].id,
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
            url: `https://${subdomain}.myclickfunnels.com/api/v2/workspaces/${workspace_id}/form_submissions`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newSubmissions = response.body;

        if (newSubmissions.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newSubmissions[newSubmissions.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newSubmissions;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 123,
        "public_id": "fsub_abc123",
        "contact_id": 456,
        "workspace_id": 789,
        "page_id": 101,
        "created_at": "2025-08-25T12:00:00.000Z",
        "updated_at": "2025-08-25T12:00:00.000Z",
        "data": {
            "email": "jane.doe@example.com",
            "first_name": "Jane",
            "last_name": "Doe",
            "custom_field_abc": "Custom Value 123"
        }
    }
});