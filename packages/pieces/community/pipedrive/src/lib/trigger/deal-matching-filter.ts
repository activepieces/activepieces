import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import { pipedriveApiCall, pipedrivePaginatedApiCall, pipedriveTransformCustomFields } from '../common'; 
import { GetField, PaginatedResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const dealMatchingFilterTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'deal-matching-filter',
    displayName: 'Deal Matching Filter',
    description: 'Triggers when a deal newly matches a Pipedrive filter for the first time (using Pipedrive API v2).',
    type: TriggerStrategy.POLLING,
    props: {
        filterId: filterIdProp('deals', true),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            defaultValue: 'all_not_deleted',
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Open',
                        value: 'open',
                    },
                    {
                        label: 'Won',
                        value: 'won',
                    },
                    {
                        label: 'Lost',
                        value: 'lost',
                    },
                    {
                        label: 'Deleted',
                        value: 'deleted',
                    },
                    {
                        label: 'All (Not Deleted)',
                        value: 'all_not_deleted',
                    },
                ],
            },
        }),
    },
    async onEnable(context) {
        const ids: number[] = [];

        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals',
            query: {
                sort_by: 'update_time',
                sort_direction: 'desc',
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status,
            },
        });

        if (!isNil(response)) {
            response.forEach((deal) => {
                ids.push(deal.id);
            });
        }

        await context.store.put('deals', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('deals');
    },
    async test(context) {
        const deals = [];

        const response = await pipedriveApiCall<PaginatedResponse<Record<string, unknown>>>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals',
            query: {
                limit: 10,
                sort_by: 'update_time',
                sort_direction: 'desc',
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status,
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        for (const deal of response.data) {
            deals.push(deal);
        }

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields',
        });

        const result = [];

        for (const deal of deals) {
            
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return result;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('deals')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];

        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/deals',
            query: {
                sort_by: 'update_time',
                sort_direction: 'desc',
                filter_id: context.propsValue.filterId,
                status: context.propsValue.status,
            },
        });

        if (isNil(response) || response.length === 0) {
            return [];
        }

        // Filter valid deals
        const newDeals = response.filter((deal) => !parsedExistingIds.includes(deal.id));

        const newIds = newDeals.map((deal) => deal.id);

        if (newIds.length === 0) {
            return [];
        }

        // Store new IDs
        const updatedIds = Array.from(new Set([...newIds, ...parsedExistingIds]));
        await context.store.put('deals', JSON.stringify(updatedIds));

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields',
        });

        const result = [];

        for (const deal of newDeals) {
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return result;
    },
    sampleData: {
        id: 1,
        creator_user_id: 8877,
        owner_id: 8877,
        person_id: 1101,
        org_id: 5,
        stage_id: 2,
        title: 'Deal One',
        value: 5000,
        currency: 'EUR',
        add_time: '2019-05-29T04:21:51Z',
        update_time: '2019-11-28T16:19:50Z',
        stage_change_time: '2019-11-28T15:41:22Z',
        is_deleted: false,
        status: 'open',
        probability: null,
        next_activity_id: 128,
        last_activity_id: null,
        lost_reason: null,
        visible_to: 1,
        close_time: null,
        pipeline_id: 1,
        won_time: '2019-11-27T11:40:36Z',
        first_won_time: '2019-11-27T11:40:36Z',
        lost_time: null,
        products_count: 0,
        files_count: 0,
        notes_count: 2,
        followers_count: 0,
        email_messages_count: 4,
        activities_count: 1,
        done_activities_count: 0,
        undone_activities_count: 1,
        participants_count: 1,
        expected_close_date: '2019-06-29',
        last_incoming_mail_time: '2019-05-29T18:21:42Z',
        last_outgoing_mail_time: '2019-05-30T03:45:35Z',
        label_ids: [11],
        rotten_time: null,
        smart_bcc_email: 'company+deal1@pipedrivemail.com',
        custom_fields: {
            "d4de1c1518b4531717c676029a45911c340390a6": {
                "value": 2300,
                "currency": "EUR"
            }
        }
    },
});
