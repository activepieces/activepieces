import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedriveCommon,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { pipedriveAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types';
import { isNil } from '@activepieces/shared';
import { DEAL_OPTIONAL_FIELDS } from '../common/constants';

interface PipedriveDealV2 {
	id: number;
	title: string;
	creator_user_id: number;
	owner_id: number;
	person_id: number | null;
	org_id: number | null;
	stage_id: number;
	pipeline_id: number;
	value: number;
	currency: string;
	add_time: string;
	update_time: string;
	stage_change_time: string;
	is_deleted: boolean;
	status: 'open' | 'won' | 'lost';
	probability: number | null;
	lost_reason: string | null;
	visible_to: number;
	close_time: string | null;
	won_time: string | null;
	first_won_time?: string;
	lost_time: string | null;
	products_count?: number;
	files_count?: number;
	notes_count?: number;
	followers_count?: number;
	email_messages_count?: number;
	activities_count?: number;
	done_activities_count?: number;
	undone_activities_count?: number;
	participants_count?: number;
	expected_close_date: string | null;
	last_incoming_mail_time?: string;
	last_outgoing_mail_time?: string;
	label_ids: number[];
	rotten_time: string | null;
	smart_bcc_email?: string;
	acv?: number;
	arr?: number;
	mrr?: number;
	custom_fields: Record<string, unknown>;
}

interface ListDealsResponseV2 {
	data: PipedriveDealV2[];
	additional_data?: {
		next_cursor?: string;
	};
}

interface GetDealResponseV2 {
	data: PipedriveDealV2;
}

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
			'create',
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
		const dealsResponse = await pipedriveApiCall<ListDealsResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/deals',
			query: {
				limit: 5,
				sort_by: 'update_time',
				sort_direction: 'desc',
				include_fields: DEAL_OPTIONAL_FIELDS.join(','),
			},
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
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

		const dealResponse = await pipedriveApiCall<GetDealResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/v2/deals/${payloadBody.data.id}`,
			query: {
				include_fields: DEAL_OPTIONAL_FIELDS.join(','),
			},
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const updatedDealProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			dealResponse.data,
		);

		return [updatedDealProperties];
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
			d4de1c1518b4531717c676029a45911c340390a6: {
				value: 2300,
				currency: 'EUR',
			},
		},
	},
});

interface WebhookInformation {
	webhookId: string;
}

type PayloadBody = {
	data: PipedriveDealV2;
	previous: PipedriveDealV2;
	meta: {
		action: string;
		entity: string;
	};
};
