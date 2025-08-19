import { pipedriveAuth } from '../../index';
import {
	createTrigger,
	DropdownOption,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedrivePaginatedV2ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, RequestParams, WebhookCreateResponse } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
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

interface PipedriveStageV2 {
	id: number;
	order_nr: number;
	name: string;
	is_deleted: boolean;
	deal_probability: number;
	pipeline_id: number;
	is_deal_rot_enabled: boolean;
	days_to_rotten: number | null;
	add_time: string;
	update_time: string | null;
}

interface ListDealsResponseV2 {
	data: PipedriveDealV2[];
	additional_data?: {
		pagination?: {
			start: number;
			limit: number;
			more_items_in_collection: boolean;
			next_cursor?: string;
		};
	};
}

interface GetDealResponseV2 {
	data: PipedriveDealV2;
}

export const updatedDealStageTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'updated-deal-stage',
	displayName: 'Updated Deal Stage',
	description: "Triggers when a deal's stage is updated.",
	type: TriggerStrategy.WEBHOOK,
	props: {
		stage_id: Property.Dropdown({
			displayName: 'Stage in Pipeline',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						placeholder: 'please connect your account.',
						disabled: true,
						options: [],
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const response = await pipedrivePaginatedV2ApiCall<PipedriveStageV2>({
					accessToken: authValue.access_token,
					apiDomain: authValue.data['api_domain'],
					method: HttpMethod.GET,
					resourceUri: '/v2/stages',
				});

				const options: DropdownOption<number>[] = [];
				for (const stage of response) {
					options.push({
						label: `${stage.name}`,
						value: stage.id,
					});
				}

				return {
					disabled: false,
					options,
				};
			},
		}),
	},
	async onEnable(context) {
		const response = await pipedriveApiCall<WebhookCreateResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/v1/webhooks',
			body: {
				subscription_url: context.webhookUrl,
				event_object: 'deal',
				event_action: 'change',
				version: '2.0',
			},
		});

		await context.store.put<string>('updated-deal-stage-trigger', response.data.id);
	},
	async onDisable(context) {
		const webhook = await context.store.get<string>('updated-deal-stage-trigger');
		if (webhook) {
			await pipedriveApiCall<WebhookCreateResponse>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.DELETE,
				resourceUri: `/v1/webhooks/${webhook}`,
			});
		}
	},
	async test(context) {
		const stageId = context.propsValue.stage_id;

		const qs: RequestParams = {
			limit: 10,
			sort_by: 'update_time',
			sort_direction: 'desc',
			include_fields: DEAL_OPTIONAL_FIELDS.join(','),
		};

		if (stageId) {
			qs['stage_id'] = stageId.toString();
		}

		const dealsResponse = await pipedriveApiCall<ListDealsResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/deals',
			query: qs,
		});

		if (isNil(dealsResponse.data)) {
			return [];
		}

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const result = [];

		for (const deal of dealsResponse.data) {
			const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);

			const stageResponse = await pipedriveApiCall<{ data: PipedriveStageV2 }>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: `/v2/stages/${updatedDealProperties.stage_id}`,
			});

			updatedDealProperties['stage'] = stageResponse.data;
			result.push(updatedDealProperties);
		}

		return result;
	},
	async run(context) {
		const stageId = context.propsValue.stage_id;

		const payloadBody = context.payload.body as PayloadBody;
		const currentDealData = payloadBody.data;
		const previousDealData = payloadBody.previous;

		if (currentDealData.stage_id !== previousDealData.stage_id) {
			if (stageId && currentDealData.stage_id !== stageId) {
				return [];
			}

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

			const stageResponse = await pipedriveApiCall<{ data: PipedriveStageV2 }>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: `/v2/stages/${currentDealData.stage_id}`,
			});

			updatedDealProperties['stage'] = stageResponse.data;

			return [updatedDealProperties];
		}
		return [];
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
		stage: {
			id: 2,
			order_nr: 1,
			name: 'Qualification',
			is_deleted: false,
			deal_probability: false,
			pipeline_id: 1,
			is_deal_rot_enabled: false,
			days_to_rotten: null,
			add_time: '2018-09-04T06:24:59Z',
			update_time: null,
		},
	},
});

type PayloadBody = {
	data: PipedriveDealV2;
	previous: PipedriveDealV2;
	meta: {
		action: string;
		entity: string;
	};
};
