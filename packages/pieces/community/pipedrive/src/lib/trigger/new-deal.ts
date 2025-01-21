import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedriveCommon,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { pipedriveAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetDealResponse, GetField, ListDealsResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const newDeal = createTrigger({
	auth: pipedriveAuth,
	name: 'new_deal',
	displayName: 'New Deal',
	description: 'Triggers when a new deal is created.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'deal',
			'added',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<WebhookInformation>('_new_deal_trigger', {
			webhookId: webhook.data.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>('_new_deal_trigger');
		if (response !== null && response !== undefined) {
			await pipedriveCommon.unsubscribeWebhook(
				response.webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const dealsResponse = await pipedriveApiCall<ListDealsResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/deals',
			query: { limit: 5, sort: 'update_time DESC' },
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		if (isNil(dealsResponse.data)) {
			return [];
		}

		const result = [];

		for (const deal of dealsResponse.data) {
			const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
			result.push(updatedDealProperties);
		}

		return result;
	},
	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;

		const dealResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/deals/${payloadBody.current.id}`,
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const updatedDealProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			dealResponse.data,
		);

		return [updatedDealProperties];
	},
	sampleData: {
		id: 1,
		creator_user_id: {
			id: 8877,
			name: 'Creator',
			email: 'john.doe@pipedrive.com',
			has_pic: false,
			pic_hash: null,
			active_flag: true,
			value: 8877,
		},
		user_id: {
			id: 8877,
			name: 'Creator',
			email: 'john.doe@pipedrive.com',
			has_pic: false,
			pic_hash: null,
			active_flag: true,
			value: 8877,
		},
		person_id: {
			active_flag: true,
			name: 'Person',
			email: [
				{
					label: 'work',
					value: 'person@pipedrive.com',
					primary: true,
				},
			],
			phone: [
				{
					label: 'work',
					value: '37244499911',
					primary: true,
				},
			],
			value: 1101,
		},
		org_id: {
			name: 'Organization',
			people_count: 2,
			owner_id: 8877,
			address: '',
			active_flag: true,
			cc_email: 'org@pipedrivemail.com',
			value: 5,
		},
		stage_id: 2,
		title: 'Deal One',
		value: 5000,
		currency: 'EUR',
		add_time: '2019-05-29 04:21:51',
		update_time: '2019-11-28 16:19:50',
		stage_change_time: '2019-11-28 15:41:22',
		active: true,
		deleted: false,
		status: 'open',
		probability: null,
		next_activity_date: '2019-11-29',
		next_activity_time: '11:30:00',
		next_activity_id: 128,
		last_activity_id: null,
		last_activity_date: null,
		lost_reason: null,
		visible_to: '1',
		close_time: null,
		pipeline_id: 1,
		won_time: '2019-11-27 11:40:36',
		first_won_time: '2019-11-27 11:40:36',
		lost_time: '',
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
		last_incoming_mail_time: '2019-05-29 18:21:42',
		last_outgoing_mail_time: '2019-05-30 03:45:35',
		label: 11,
		stage_order_nr: 2,
		person_name: 'Person',
		org_name: 'Organization',
		next_activity_subject: 'Call',
		next_activity_type: 'call',
		next_activity_duration: '00:30:00',
		next_activity_note: 'Note content',
		formatted_value: '€5,000',
		weighted_value: 5000,
		formatted_weighted_value: '€5,000',
		weighted_value_currency: 'EUR',
		rotten_time: null,
		owner_name: 'Creator',
		cc_email: 'company+deal1@pipedrivemail.com',
		org_hidden: false,
		person_hidden: false,
		average_time_to_won: {
			y: 0,
			m: 0,
			d: 0,
			h: 0,
			i: 20,
			s: 49,
			total_seconds: 1249,
		},
		average_stage_progress: 4.99,
		age: {
			y: 0,
			m: 6,
			d: 14,
			h: 8,
			i: 57,
			s: 26,
			total_seconds: 17139446,
		},
		stay_in_pipeline_stages: {
			times_in_stages: {
				'1': 15721267,
				'2': 1288449,
				'3': 4368,
				'4': 3315,
				'5': 26460,
			},
			order_of_stages: [1, 2, 3, 4, 5],
		},
		last_activity: null,
		next_activity: null,
	},
});

interface WebhookInformation {
	webhookId: string;
}

type PayloadBody = {
	current: Record<string, unknown>;
	previous: Record<string, unknown>;
};
