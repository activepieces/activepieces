import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
	pipedriveApiCall,
	pipedriveCommon,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetDealResponse, GetField, LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const updatedOrganizationTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'updated-organization',
	displayName: 'Updated Organization',
	description: 'Triggers when an existing organization is updated.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'organization',
			'updated',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<{
			webhookId: string;
		}>('_updated_organization_trigger', {
			webhookId: webhook.data.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<{
			webhookId: string;
		}>('_updated_organization_trigger');
		if (response !== null && response !== undefined) {
			await pipedriveCommon.unsubscribeWebhook(
				response.webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const response = await pipedriveApiCall<LeadListResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizations',
			query: { limit: 10, sort: 'update_time DESC' },
		});

		if (isNil(response.data)) {
			return [];
		}
		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const result = [];

		for (const org of response.data) {
			const updatedOrgProperties = pipedriveTransformCustomFields(customFieldsResponse, org);
			result.push(updatedOrgProperties);
		}

		return result;
	},
	async run(context) {
		const payloadBody = context.payload.body as {
			current: Record<string, unknown>;
			previous: Record<string, unknown>;
		};

		const orgResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/organizations/${payloadBody.current.id}`,
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const updatedOrgProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			orgResponse.data,
		);

		return [updatedOrgProperties];
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
