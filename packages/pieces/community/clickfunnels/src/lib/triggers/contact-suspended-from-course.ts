import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_contact_suspended_trigger_data';

interface TriggerData {
    processed_ids: number[];
}

export const contactSuspendedFromCourseTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'contact_suspended_from_course',
    displayName: 'Contact Suspended From Course',
    description: "Triggers when a contact's enrollment in a specific course becomes suspended.",
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        course_id: Property.Number({
            displayName: 'Course ID',
            description: 'The numeric ID of the course to monitor for suspensions.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    async onEnable(context) {
        // Initialize the store with an empty array to avoid triggering on existing suspended contacts
        await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
            processed_ids: [],
        });
    },

    // onDisable runs once when the trigger is turned off.
    async onDisable(context) {
        await context.store.delete(TRIGGER_DATA_STORE_KEY);
    },

    // run is executed on a schedule to check for new data.
    async run(context) {
        const { subdomain, course_id } = context.propsValue;
        const triggerData = await context.store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);
        const processedIds = triggerData?.processed_ids ?? [];

        const queryParams: QueryParams = {
            'filter[suspended]': 'true',
        };

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/enrollments`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const currentlySuspendedEnrollments = response.body;

        const newSuspensions = currentlySuspendedEnrollments.filter(
            (enrollment) => !processedIds.includes(enrollment.id)
        );

        if (newSuspensions.length > 0) {
            const allSuspendedIds = currentlySuspendedEnrollments.map(e => e.id);
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                processed_ids: allSuspendedIds,
            });
        }

        return newSuspensions;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 8,
        "public_id": "enr_suspended123",
        "contact_id": 101,
        "course_id": 202,
        "created_at": "2025-08-01T10:00:00.000Z",
        "updated_at": "2025-08-25T14:00:00.000Z",
        "suspended": true,
        "suspension_reason": "Payment failed",
        "current_path": "/enrollments/xyz...",
        "origination_source_type": "Membership",
        "origination_source_id": 99
    }
});