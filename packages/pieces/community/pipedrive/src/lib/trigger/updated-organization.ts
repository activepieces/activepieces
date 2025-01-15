import { pipedriveAuth } from '../../';
import {
    createTrigger,
    PiecePropValueSchema,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof pipedriveAuth>, Record<string, unknown>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth, lastFetchEpochMS }) {
        const organizations = [];

        if (lastFetchEpochMS === 0) {
            const response = await pipedriveApiCall<LeadListResponse>({
                accessToken: auth.access_token,
                apiDomain: auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/organizations',
                query: { limit: 10, sort: 'update_time DESC' },
            });

            if (isNil(response.data)) {
                return [];
            }

            for (const org of response.data) {
                organizations.push(org);
            }
        } else {
            const response = await pipedrivePaginatedApiCall<Record<string, any>>({
                accessToken: auth.access_token,
                apiDomain: auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/organizations',
                query: { sort: 'update_time DESC' },
            });
            if (isNil(response)) {
                return [];
            }

            for (const org of response) {
                organizations.push(org);
            }
        }

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: auth.access_token,
            apiDomain: auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/organizationFields',
        });

        const items = [];

        for (const org of organizations) {
            const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
            items.push(updatedOrgProperties);
        }

        return items.map((org) => {
            return {
                epochMilliSeconds: dayjs(org.add_time).valueOf(),
                data: org,
            };
        });
    },
};

export const updatedOrganizationTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'updated-organization',
    displayName: 'Updated Organization',
    description: 'Triggers when an existing organization is updated.',
    props: {},
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    sampleData: {
        id: 1,
        company_id: 13937255,
        owner_id: {
            id: 22701301,
            name: 'john',
            email: 'john@test.com',
            has_pic: 0,
            pic_hash: null,
            active_flag: true,
            value: 22701301,
        },
        name: 'Pipedrive',
        open_deals_count: 3,
        related_open_deals_count: 1,
        closed_deals_count: 0,
        related_closed_deals_count: 0,
        email_messages_count: 0,
        people_count: 3,
        activities_count: 1,
        done_activities_count: 0,
        undone_activities_count: 1,
        files_count: 0,
        notes_count: 4,
        followers_count: 1,
        won_deals_count: 0,
        related_won_deals_count: 0,
        lost_deals_count: 0,
        related_lost_deals_count: 0,
        active_flag: true,
        picture_id: null,
        country_code: null,
        first_char: 'a',
        update_time: '2024-12-14 11:03:19',
        delete_time: null,
        add_time: '2024-12-04 03:49:06',
        visible_to: '3',
        next_activity_date: '2024-12-04',
        next_activity_time: null,
        next_activity_id: 4,
        last_activity_id: null,
        last_activity_date: null,
        label: null,
        label_ids: [],
        address: null,
        address_subpremise: null,
        address_street_number: null,
        address_route: null,
        address_sublocality: null,
        address_locality: null,
        address_admin_area_level_1: null,
        address_admin_area_level_2: null,
        address_country: null,
        address_postal_code: null,
        address_formatted_address: null,
        owner_name: 'John',
        cc_email: null,
    },
});
