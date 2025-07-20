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

export const organizationMatchingFilterTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'organization-matching-filter',
	displayName: 'Organization Matching Filter',
	description: 'Trigges when an organization newly matches a Pipedrive filter for the first time.',
	type: TriggerStrategy.POLLING,
	props: {
		filterId: filterIdProp('org', true),
	},
	async onEnable(context) {
		const ids: number[] = [];
		const response = await pipedrivePaginatedApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizations:(id)',
			query: { sort: 'update_time DESC', filter_id: context.propsValue.filterId },
		});
		if (!isNil(response)) {
			response.forEach((organization) => {
				ids.push(organization.id);
			});
		}
		await context.store.put('organizations', JSON.stringify(ids));
	},
	async onDisable(context) {
		await context.store.delete('organizations');
	},
	async test(context) {
		const organizations = [];

		const response = await pipedriveApiCall<LeadListResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizations',
			query: {
				limit: 10,
				sort: 'update_time DESC',
				filter_id: context.propsValue.filterId,
			},
		});

		if (isNil(response.data)) {
			return [];
		}

		for (const org of response.data) {
			organizations.push(org);
		}

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const result = [];

		for (const org of organizations) {
			const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
			result.push(updatedOrgProperties);
		}

		return result;
	},
	async run(context) {
		const existingIds = (await context.store.get<string>('organizations')) ?? '[]';
		const parsedExistingIds = JSON.parse(existingIds) as number[];

		const response = await pipedrivePaginatedApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizations',
			query: { sort: 'update_time DESC', filter_id: context.propsValue.filterId },
		});

		if (isNil(response) || response.length === 0) {
			return [];
		}

		// Filter valid organizations
		const newOrganizations = response.filter(
			(organization) => !parsedExistingIds.includes(organization.id),
		);

		const newIds = newOrganizations.map((organization) => organization.id);

		if (newIds.length === 0) {
			return [];
		}


		// Store new IDs
		await context.store.put('organizations', JSON.stringify([...newIds,...parsedExistingIds]));

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const result = [];

		// Transform valid organizations fields
		for (const org of newOrganizations) {
			const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
			result.push(updatedOrgProperties);
		}

		return result;
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
