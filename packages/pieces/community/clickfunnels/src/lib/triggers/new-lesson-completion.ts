import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/common';
const TRIGGER_DATA_STORE_KEY = 'clickfunnels_new_lesson_completion_trigger_data';

interface TriggerData {
    last_fetched_id?: number;
}

export const newLessonCompletionTrigger = createTrigger({
    auth: clickfunnelsAuth,
    name: 'new_lesson_completion',
    displayName: 'New Lesson Completion',
    description: 'Triggers when a contact completes a lesson in a specific course.',
    
    props: {
        subdomain: Property.ShortText({
            displayName: 'Workspace Subdomain',
            description: 'The subdomain of your ClickFunnels workspace (e.g., "myworkspace" from myworkspace.myclickfunnels.com).',
            required: true,
        }),
        course_id: Property.Number({
            displayName: 'Course ID',
            description: 'The numeric ID of the course to monitor for lesson completions.',
            required: true,
        }),
    },

    type: TriggerStrategy.POLLING,

    // onEnable runs once when the trigger is turned on.
    async onEnable(context) {
        const { subdomain, course_id } = context.propsValue;

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/lesson_completions`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: { 'sort_order': 'desc' }
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const completions = response.body;

        if (completions.length > 0) {
            // Store the ID of the most recent lesson completion
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: completions[0].id,
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
            url: `https://${subdomain}.myclickfunnels.com/api/v2/courses/${course_id}/lesson_completions`,
            headers: { 'Authorization': `Bearer ${context.auth}` },
            queryParams: queryParams
        };

        const response = await httpClient.sendRequest<any[]>(request);
        const newCompletions = response.body;

        if (newCompletions.length > 0) {
            // The last item in the ascending list is the newest
            const latestId = newCompletions[newCompletions.length - 1].id;
            await context.store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
                last_fetched_id: latestId,
            });
        }

        return newCompletions;
    },

    // Sample data for the user to map from when building their flow
    sampleData: {
        "id": 2,
        "public_id": "GCHEpy",
        "enrollment_id": 12,
        "lesson_id": 12,
        "completed_at": "2025-07-16T20:24:36.000Z"
    }
});