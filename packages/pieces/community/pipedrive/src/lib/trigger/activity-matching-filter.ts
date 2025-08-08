import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import { pipedriveApiCall, pipedrivePaginatedApiCall } from '../common';
import { isNil } from '@activepieces/shared';
import { PaginatedResponse } from '../common/types'; // Using PaginatedResponse for list types

export const activityMatchingFilterTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'activity-matching-filter',
    displayName: 'Activity Matching Filter',
    description: 'Triggers when an activity newly matches a Pipedrive filter for the first time (using Pipedrive API v2).', // ✅ Updated description
    type: TriggerStrategy.POLLING,
    props: {
        filterId: filterIdProp('activity', true),
    },
    async onEnable(context) {
        const ids: number[] = [];

        
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/activities', 
            query: {
                sort_by: 'update_time',
                sort_direction: 'desc', 
                filter_id: context.propsValue.filterId,
                owner_id: 0, 
            },
        });

        if (!isNil(response)) {
            response.forEach((activity) => {
                ids.push(activity.id);
            });
        }

        await context.store.put('activities', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('activities');
    },
    async test(context) {
        const activities = [];

        // ✅ Use v2 endpoint and v2 sorting parameters
        const response = await pipedriveApiCall<PaginatedResponse<Record<string, unknown>>>({ 
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/activities', 
            query: {
                limit: 10,
                sort_by: 'update_time', 
                sort_direction: 'desc',
                filter_id: context.propsValue.filterId,
                owner_id: 0, 
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        // The response.data is already an array from PaginatedResponse<T>, so direct iteration is fine.
        for (const activity of response.data) {
            activities.push(activity);
        }

        return activities;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('activities')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];

        
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/activities', 
            query: {
                sort_by: 'update_time', 
                filter_id: context.propsValue.filterId,
                owner_id: 0, 
            },
        });

        if (isNil(response) || response.length === 0) {
            return [];
        }

        // Filter valid activities
        const newActivities = response.filter((activity) => !parsedExistingIds.includes(activity.id));

        const newIds = newActivities.map((activity) => activity.id);

        
        if (newIds.length > 0) {
            // Store new IDs by prepending them to maintain a recent history, but ensure no duplicates if ids overlap
            const updatedIds = Array.from(new Set([...newIds, ...parsedExistingIds]));
            await context.store.put('activities', JSON.stringify(updatedIds));
        }

        return newActivities;
    },
    sampleData: {
        id: 8,
        owner_id: 1234, 
        done: false, 
        type: 'deadline',
        due_date: '2020-06-09', // Good
        due_time: '10:00', // Good
        duration: '01:00', // Good
        busy: true, 
        add_time: '2020-06-08T12:37:56Z', 
        marked_as_done_time: '2020-08-08T08:08:38Z', 
        subject: 'Deadline',
        public_description: 'This is a description', // Good
        location: { 
            value: 'Mustamäe tee 3, Tallinn, Estonia',
            street_number: '3',
            route: 'Mustamäe tee',
            sublocality: 'Kristiine',
            locality: 'Tallinn',
            admin_area_level_1: 'Harju maakond',
            admin_area_level_2: '',
            country: 'Estonia',
            postal_code: '10616',
            formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
        },
        org_id: 5, 
        person_id: 1101, 
        deal_id: 300,
        lead_id: '46c3b0e1-db35-59ca-1828-4817378dff71', 
        is_deleted: false, 
        update_time: '2020-08-08T12:37:56Z', 
        note: 'A note for the activity', 
        creator_user_id: 1234, 
        attendees: [
            {
                email_address: 'attendee@pipedrivemail.com',
                is_organizer: false, 
                name: 'Attendee',
                person_id: 25312,
                status: 'accepted', 
                user_id: null,
            },
        ],
        participants: [
            {
                person_id: 17985,
                primary_flag: false, // Already boolean, good
            },
            {
                person_id: 1101,
                primary_flag: true, // Already boolean, good
            },
        ],
        
    },
});
