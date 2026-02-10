import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
    pipedriveTransformV1CustomFields,
} from '../common';
import { GetField } from '../common/types';
import { isNil } from '@activepieces/shared';

interface PipedriveLeadV2 {
	id: string;
	title: string;
	owner_id: number;
	creator_id: number;
	label_ids: string[];
	value: number | null;
	expected_close_date: string | null;
	person_id: number | null;
	organization_id: number | null;
	is_archived: boolean;
	source_name: string;
	origin: string;
	origin_id: string | null;
	channel: number | null;
	channel_id: string | null;
	was_seen: boolean;
	next_activity_id: number | null;
	add_time: string;
	update_time: string;
	visible_to: number;
	custom_fields?: Record<string, unknown>;
}

interface LeadListResponseV2 {
	data: PipedriveLeadV2[];
	additional_data?: {
		pagination?: {
			start: number;
			limit: number;
			more_items_in_collection: boolean;
			next_cursor?: string;
		};
	};
}

interface GetLeadResponseV2 {
	data: PipedriveLeadV2;
}

export const newLeadTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'new-lead',
	displayName: 'New Lead',
	description: 'Triggers when a new lead is created.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const response = await httpClient.sendRequest<{ data: { id: string } }>({
			method: HttpMethod.POST,
			url: `${context.auth.data['api_domain']}/api/v1/webhooks`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
			body: {
				event_object: 'lead',
				event_action: 'create',
				subscription_url: context.webhookUrl,
				version: '2.0',
			},
		});

		await context.store?.put<{
			webhookId: string;
		}>('_new_lead_trigger', {
			webhookId: response.body.data.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<{
			webhookId: string;
		}>('_new_lead_trigger');
		if (response !== null && !isNil(response.webhookId)) {
			await httpClient.sendRequest({
				method: HttpMethod.DELETE,
				url: `${context.auth.data['api_domain']}/api/v1/webhooks/${response.webhookId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.access_token,
				},
			});
		}
	},
	async test(context) {
		const response = await pipedriveApiCall<LeadListResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/leads',
			query: {
				limit: 10,
				sort: 'update_time DESC',
			},
		});

		if (isNil(response.data)) {
			return [];
		}
		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const result = [];

		for (const lead of response.data) {
			const updatedLeadProperties = pipedriveTransformV1CustomFields(customFieldsResponse, lead);
			result.push(updatedLeadProperties);
		}

		return result;
	},
	async run(context) {
		const payloadBody = context.payload.body as {
			data: PipedriveLeadV2;
			previous: PipedriveLeadV2;
			meta: {
				action: string;
				entity: string;
			};
		};

		const leadResponse = await pipedriveApiCall<GetLeadResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/v1/leads/${payloadBody.data.id}`,
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const updatedLeadProperties = pipedriveTransformV1CustomFields(
			customFieldsResponse,
			leadResponse.data,
		);

		return [updatedLeadProperties];
	},
	sampleData: {
		id: 'f3c23480-c9b1-11ef-bc83-2b8218e028ef',
		title: 'Test lead',
		owner_id: 22701301,
		creator_id: 22701301,
		label_ids: ['a0e5f330-d2a7-4181-a6e3-a44d634b7bf7', '8a0e6918-1eee-4e56-a615-c81d712a6a77'],
		value: null,
		expected_close_date: null,
		person_id: 2,
		organization_id: 1,
		is_archived: false,
		source_name: 'Manually created',
		origin: 'ManuallyCreated',
		origin_id: null,
		channel: 1,
		channel_id: null,
		was_seen: true,
		next_activity_id: null,
		add_time: '2025-01-03T09:06:00.776Z',
		update_time: '2025-01-03T09:06:00.776Z',
		visible_to: 3,
	},
});
