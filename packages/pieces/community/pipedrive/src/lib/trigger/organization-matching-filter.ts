import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedrivePaginatedV2ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types';
import { isNil } from '@activepieces/shared';
import { ORGANIZATION_OPTIONAL_FIELDS } from '../common/constants';

interface PipedriveOrganizationV2 {
	id: number;
	name: string;
	owner_id: number;
	add_time: string;
	update_time: string;
	is_deleted: boolean;
	visible_to: number;
	picture_id: number | null;
	label_ids: number[];
	address: {
		value: string | null;
		street_number: string | null;
		route: string | null;
		sublocality: string | null;
		locality: string | null;
		admin_area_level_1: string | null;
		admin_area_level_2: string | null;
		country: string | null;
		postal_code: string | null;
		formatted_address: string | null;
	} | null;
	custom_fields: Record<string, unknown>;
	next_activity_id?: number | null;
	last_activity_id?: number | null;
	open_deals_count?: number;
	related_open_deals_count?: number;
	closed_deals_count?: number;
	related_closed_deals_count?: number;
	participant_open_deals_count?: number;
	participant_closed_deals_count?: number;
	email_messages_count?: number;
	activities_count?: number;
	done_activities_count?: number;
	undone_activities_count?: number;
	files_count?: number;
	notes_count?: number;
	followers_count?: number;
	won_deals_count?: number;
	related_won_deals_count?: number;
	lost_deals_count?: number;
	related_lost_deals_count?: number;
	last_incoming_mail_time?: string | null;
	last_outgoing_mail_time?: string | null;
	marketing_status?: string;
	doi_status?: string;
}

interface OrganizationListResponseV2 {
	data: PipedriveOrganizationV2[];
	additional_data?: {
		pagination?: {
			start: number;
			limit: number;
			more_items_in_collection: boolean;
			next_cursor?: string;
		};
	};
}

export const organizationMatchingFilterTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'organization-matching-filter',
	displayName: 'Organization Matching Filter',
	description: 'Triggers when an organization newly matches a Pipedrive filter for the first time.',
	type: TriggerStrategy.POLLING,
	props: {
		filterId: filterIdProp('org', true),
	},
	async onEnable(context) {
		const ids: number[] = [];
		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/organizations',
			query: {
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
			},
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
		const response = await pipedriveApiCall<OrganizationListResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/organizations',
			query: {
				limit: 10,
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
				include_fields: ORGANIZATION_OPTIONAL_FIELDS.join(','),
			},
		});

		if (isNil(response.data)) {
			return [];
		}

		for (const org of response.data) {
			organizations.push(org);
		}

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/organizationFields',
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
		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/organizations',
			query: {
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
				include_fields: ORGANIZATION_OPTIONAL_FIELDS.join(','),
			},
		});

		if (isNil(response) || response.length === 0) {
			return [];
		}

		const newOrganizations = response.filter(
			(organization) => !parsedExistingIds.includes(organization.id),
		);

		const newIds = newOrganizations.map((organization) => organization.id);

		if (newIds.length === 0) {
			return [];
		}

		await context.store.put('organizations', JSON.stringify([...newIds, ...parsedExistingIds]));

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/organizationFields',
		});

		const result = [];

		for (const org of newOrganizations) {
			const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
			result.push(updatedOrgProperties);
		}

		return result;
	},
	sampleData: {
		id: 1,
		owner_id: 22701301,
		name: 'Pipedrive Sample Org',
		add_time: '2024-12-04T03:49:06Z',
		update_time: '2024-12-14T11:03:19Z',
		is_deleted: false,
		visible_to: 3,
		picture_id: null,
		label_ids: [],
		address: {
			value: 'Mustamäe tee 3, Tallinn, Estonia',
			street_number: '3',
			route: 'Mustamäe tee',
			sublocality: 'Kristiine',
			locality: 'Tallinn',
			admin_area_level_1: 'Harju maakond',
			admin_area_level_2: null,
			country: 'Estonia',
			postal_code: '10616',
			formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
		},
		custom_fields: {
			your_custom_field_key: 'your_custom_field_value',
		},
	},
});
