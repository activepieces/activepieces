import {
	createTrigger,
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedriveCommon,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { pipedriveAuth } from '../..';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FieldsResponse, GetField, RequestParams } from '../common/types';
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

export const updatedDeal = createTrigger({
	auth: pipedriveAuth,
	name: 'updated_deal',
	displayName: 'Updated Deal',
	description: 'Triggers when a deal is updated.',
	props: {
		filter_by: Property.StaticDropdown({
			displayName: 'Filter by',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Deal Status',
						value: 'status',
					},
					{
						label: 'Stage in Pipeline',
						value: 'stage_id',
					},
				],
			},
		}),
		filter_by_field_value: Property.DynamicProperties({
			displayName: 'Field Values',
			required: false,
			refreshers: ['filter_by'],
			props: async ({ auth, filter_by }) => {
				if (!auth || !filter_by) return {};

				const props: DynamicPropsValue = {};
				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const filterBy = filter_by as unknown as string;

				if (filterBy === 'status') {
					props['field_value'] = Property.StaticDropdown({
						displayName: 'Deal Status',
						required: true,
						options: {
							disabled: false,
							options: [
								{ label: 'Open', value: 'open' },
								{ label: 'Won', value: 'won' },
								{ label: 'Lost', value: 'lost' },
								{ label: 'Deleted', value: 'deleted' },
							],
						},
					});
				}
				if (filterBy === 'stage_id') {
					const response = await httpClient.sendRequest<{
						data: PipedriveStageV2[];
					}>({
						method: HttpMethod.GET,
						url: `${authValue.data['api_domain']}/api/v2/stages`,
						authentication: {
							type: AuthenticationType.BEARER_TOKEN,
							token: authValue.access_token,
						},
					});
					props['field_value'] = Property.StaticDropdown({
						displayName: 'Stage in Pipeline',
						required: true,
						options: {
							disabled: false,
							options: response.body.data.map((stage) => {
								return {
									label: stage.name,
									value: stage.id,
								};
							}),
						},
					});
				}
				return props;
			},
		}),
		field_to_watch: Property.Dropdown({
			displayName: 'Field to watch for Changes On',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						placeholder: 'Connect your account',
						disabled: true,
						options: [],
					};
				}

				const authValue = auth as PiecePropValueSchema<typeof pipedriveAuth>;
				const response = await httpClient.sendRequest<FieldsResponse>({
					method: HttpMethod.GET,
					url: `${authValue.data['api_domain']}/api/v1/dealFields`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				});

				const options: DropdownOption<string>[] = [];

				for (const field of response.body.data) {
					options.push({
						label: field.name,
						value: field.key,
					});
				}

				return {
					disabled: false,
					options,
				};
			},
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'deal',
			'change',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<string>('_updated_deal_trigger', webhook.data.id);
	},
	async onDisable(context) {
		const webhookId = await context.store.get<string>('_updated_deal_trigger');
		if (webhookId) {
			await pipedriveCommon.unsubscribeWebhook(
				webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const filterBy = context.propsValue.filter_by;
		const filterByValue = context.propsValue.filter_by_field_value!['field_value'];

		const qs: RequestParams = {
			limit: 10,
			sort_by: 'update_time',
			sort_direction: 'desc',
			include_fields: DEAL_OPTIONAL_FIELDS.join(','),
		};

		if (filterBy && filterByValue) {
			qs[filterBy] = filterByValue;
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
			result.push(updatedDealProperties);
		}

		return result;
	},
	async run(context) {
		const filterBy = context.propsValue.filter_by;
		const filterByValue = context.propsValue.filter_by_field_value!['field_value'];
		const fieldToWatch =
			context.propsValue.field_to_watch === 'label'
				? 'label_ids'
				: context.propsValue.field_to_watch;

		const payloadBody = context.payload.body as {
			data: Record<string, any>;
			previous: Record<string, any>;
			meta: {
				action: string;
				entity: string;
			};
		};
		const currentDealData = flattenCustomFields(payloadBody.data);
		const previousDealData = flattenCustomFields(payloadBody.previous);

		const noFilterAndNoField = !filterBy && !fieldToWatch;
		const isFieldChanged =
			fieldToWatch &&
			fieldToWatch in previousDealData && // The previous object now only contains fields whose values have changed
			currentDealData[fieldToWatch] !== previousDealData[fieldToWatch]; 
		const isFilterMatched = filterBy && currentDealData[filterBy] === filterByValue;

		if (
			noFilterAndNoField ||
			(!filterBy && isFieldChanged) ||
			(isFilterMatched && (!fieldToWatch || isFieldChanged))
		) {
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
	},
});

function flattenCustomFields(deal: Record<string, any>): Record<string, any> {
	const { custom_fields, ...rest } = deal;

	if (!custom_fields) return rest;

	const flatCustomFields: Record<string, any> = {};

	for (const [key, value] of Object.entries(custom_fields as Record<string, any>)) {
		if (isNil(value)) {
			flatCustomFields[key] = value;
			continue;
		}

		const type = value['type'] as string;

		switch (type) {
			case 'varchar':
			case 'text':
			case 'varchar_auto':
			case 'double':
			case 'phone':
			case 'date':
				flatCustomFields[key] = value?.value;
				break;
			case 'set':
				flatCustomFields[key] = value?.values?.length
					? value.values.map((v: any) => v.id).join(',')
					: '';
				break;
			case 'enum':
			case 'user':
			case 'org':
			case 'people':
				flatCustomFields[key] = value?.id;
				break;
			case 'monetary':
				flatCustomFields[key] = value?.value;
				flatCustomFields[`${key}_currency`] = value?.currency;
				break;
			case 'time':
				flatCustomFields[key] = value?.value;
				flatCustomFields[`${key}_timezone_id`] = value?.timezone_id;
				break;
			case 'timerange':
				flatCustomFields[key] = value?.from;
				flatCustomFields[`${key}_timezone_id`] = value?.timezone_id;
				flatCustomFields[`${key}_until`] = value?.until;
				break;
			case 'daterange':
				flatCustomFields[key] = value?.from;
				flatCustomFields[`${key}_until`] = value?.until;
				break;
			case 'address':
				flatCustomFields[key] = value?.value;
				flatCustomFields[`${key}_subpremise`] = value?.subpremise;
				flatCustomFields[`${key}_street_number`] = value?.street_number;
				flatCustomFields[`${key}_route`] = value?.route;
				flatCustomFields[`${key}_sublocality`] = value?.sublocality;
				flatCustomFields[`${key}_locality`] = value?.locality;
				flatCustomFields[`${key}_admin_area_level_1`] = value?.admin_area_level_1;
				flatCustomFields[`${key}_admin_area_level_2`] = value?.admin_area_level_2;
				flatCustomFields[`${key}_country`] = value?.country;
				flatCustomFields[`${key}_postal_code`] = value?.postal_code;
				flatCustomFields[`${key}_formatted_address`] = value?.formatted_address;
				break;
		}
	}

	return {
		...rest,
		...flatCustomFields,
	};
}
