import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';

const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_course_enrollment_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newCourseEnrollmentTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_course_enrollment',
    displayName: 'New Course Enrollment',
    description: 'Triggers when a new contact is enrolled in a specific course.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        course_id: Property.Number({
            displayName: 'Course ID',
            description: 'The numeric ID of the course to monitor for new enrollments.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    // It fetches the latest enrollment to set a starting point.
    async onEnable(context) {
        const { subdomain, course_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/enrollments`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: { sort_order: 'desc' } // Get newest first
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const enrollments = response.body;

        if (enrollments.length > 0) {
            // Store the ID of the most recent enrollment
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: enrollments[0].id,
            });
        }
    },

    // onDisable runs once when the trigger is turned off.
    async onDisable(context) {
        await context.store.delete(TRIGGER_DATA_STORE_KEY);
    },

    // run is executed on a schedule to check for new data.
    async run(context) {
        const { subdomain, course_id } = context.propsValue;
        const triggerData = await context.store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);

        const queryParams: QueryParams = {};
        if (triggerData?.last_fetched_id) {
            queryParams['after'] = triggerData.last_fetched_id.toString();
        }

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/enrollments`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newEnrollments = response.body;

        if (newEnrollments.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newEnrollments[newEnrollments.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newEnrollments;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 3,
        "public_id": "LeYpoK",
        "contact_id": 49,
        "course_id": 16,
        "created_at": "2025-05-16T20:25:35.094Z",
        "updated_at": "2025-06-16T20:25:35.094Z",
        "suspended": false,
        "suspension_reason": null,
        "current_path": "/enrollments/dee5708ee9b71d19336d5a9c938da270e0d288e14c5092fd90c0d912fd5a9bd421",
        "origination_source_type": "Membership",
        "origination_source_id": 60
    }
});