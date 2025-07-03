import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { GetField, LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const personMatchingFilterTrigger = createTrigger({
    auth: pipedriveAuth,
    name: 'person-matching-filter',
    displayName: 'Person Matching Filter',
    description: 'Trigges when a person newly matches a Pipedrive filter for the first time.',
    type: TriggerStrategy.POLLING,
    props: {
        filterId: filterIdProp('people', true),
    },
    async onEnable(context) {
        const ids: number[] = [];
        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/persons:(id)',
            query: { sort: 'update_time DESC', filter_id: context.propsValue.filterId },
        });
        if (!isNil(response)) {
            response.forEach((person) => {
                ids.push(person.id);
            });
        }
        await context.store.put('persons', JSON.stringify(ids));
    },
    async onDisable(context) {
        await context.store.delete('persons');
    },
    async test(context) {
        const persons = [];

        const response = await pipedriveApiCall<LeadListResponse>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/persons',
            query: {
                limit: 10,
                sort: 'update_time DESC',
                filter_id: context.propsValue.filterId,
            },
        });

        if (isNil(response.data)) {
            return [];
        }

        for (const person of response.data) {
            persons.push(person);
        }

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/personFields',
        });

        const result = [];

        for (const person of persons) {
            const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
            result.push(updatedPersonProperties);
        }

        return result;
    },
    async run(context) {
        const existingIds = (await context.store.get<string>('persons')) ?? '[]';
        const parsedExistingIds = JSON.parse(existingIds) as number[];

        const response = await pipedrivePaginatedApiCall<{ id: number }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/persons',
            query: { sort: 'update_time DESC', filter_id: context.propsValue.filterId },
        });

        if (isNil(response) || response.length === 0) {
            return [];
        }

        // Filter valid persons
        const newPersons = response.filter(
            (person) => !parsedExistingIds.includes(person.id),
        );

        const newIds = newPersons.map((person) => person.id);

        if (newIds.length === 0) {
            return [];
        }


        // Store new IDs
        await context.store.put('persons', JSON.stringify([...newIds,...parsedExistingIds]));

        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/personFields',
        });

        const result = [];

        // Transform valid persons fields
        for (const person of newPersons) {
            const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
            result.push(updatedPersonProperties);
        }


        return result;
    },
    sampleData: {
		id: 1,
		company_id: 12,
		owner_id: {
			id: 123,
			name: 'Jane Doe',
			email: 'jane@pipedrive.com',
			has_pic: 1,
			pic_hash: '2611ace8ac6a3afe2f69ed56f9e08c6b',
			active_flag: true,
			value: 123,
		},
		org_id: {
			name: 'Org Name',
			people_count: 1,
			owner_id: 123,
			address: 'Mustamäe tee 3a, 10615 Tallinn',
			active_flag: true,
			cc_email: 'org@pipedrivemail.com',
			value: 1234,
		},
		name: 'Will Smith',
		first_name: 'Will',
		last_name: 'Smith',
		open_deals_count: 2,
		related_open_deals_count: 2,
		closed_deals_count: 3,
		related_closed_deals_count: 3,
		participant_open_deals_count: 1,
		participant_closed_deals_count: 1,
		email_messages_count: 1,
		activities_count: 1,
		done_activities_count: 1,
		undone_activities_count: 2,
		files_count: 2,
		notes_count: 2,
		followers_count: 3,
		won_deals_count: 3,
		related_won_deals_count: 3,
		lost_deals_count: 1,
		related_lost_deals_count: 1,
		active_flag: true,
		phone: [
			{
				value: '12345',
				primary: true,
				label: 'work',
			},
		],
		email: [
			{
				value: '12345@email.com',
				primary: true,
				label: 'work',
			},
		],
		primary_email: '12345@email.com',
		first_char: 'w',
		update_time: '2020-05-08 05:30:20',
		add_time: '2017-10-18 13:23:07',
		visible_to: '3',
		marketing_status: 'no_consent',
		picture_id: {
			item_type: 'person',
			item_id: 25,
			active_flag: true,
			add_time: '2020-09-08 08:17:52',
			update_time: '0000-00-00 00:00:00',
			added_by_user_id: 967055,
			pictures: {
				'128':
					'https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_128.jpg',
				'512':
					'https://pipedrive-profile-pics.s3.example.com/f8893852574273f2747bf6ef09d11cfb4ac8f269_512.jpg',
			},
			value: 4,
		},
		next_activity_date: '2019-11-29',
		next_activity_time: '11:30:00',
		next_activity_id: 128,
		last_activity_id: 34,
		last_activity_date: '2019-11-28',
		last_incoming_mail_time: '2019-05-29 18:21:42',
		last_outgoing_mail_time: '2019-05-30 03:45:35',
		label: 1,
		org_name: 'Organization name',
		owner_name: 'Jane Doe',
		cc_email: 'org@pipedrivemail.com',
	},
});
