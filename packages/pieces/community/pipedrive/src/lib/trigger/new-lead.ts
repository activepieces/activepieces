import { pipedriveAuth } from '../../';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetDealResponse, GetField, LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

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
		const response = await pipedriveApiCall<LeadListResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/leads',
			query: { limit: 10, sort: 'update_time DESC' },
		});

		if (isNil(response.data)) {
			return [];
		}
		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const result = [];

		for (const lead of response.data) {
			const updatedLeadProperties = pipedriveTransformCustomFields(customFieldsResponse, lead);
			result.push(updatedLeadProperties);
		}

		return result;
	},
	async run(context) {
		const payloadBody = context.payload.body as {
			data: Record<string, unknown>;
			previous: Record<string, unknown>;
		};

		const leadResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/leads/${payloadBody.data.id}`,
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const updatedLeadProperties = pipedriveTransformCustomFields(
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
		visible_to: '3',
	},
});
