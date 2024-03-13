import {
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import {
	AuthenticationType,
	DedupeStrategy,
	HttpMethod,
	HttpRequest,
	Polling,
	httpClient,
	pollingHelper,
} from '@activepieces/pieces-common';

import dayjs from 'dayjs';

import { hubspotAuth } from '../../';

import {
	ListDealPipelinesResponse,
	ListPipelineStagesResponse,
	SearchDealsResponse,
} from '../common/models';

const polling: Polling<
	PiecePropValueSchema<typeof hubspotAuth>,
	{ pipelineId: string; dealStageId: string }
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const items: {
			id: string;
			createdAt: string;
			updatedAt: string;
			properties: Record<string, any>;
		}[] = [];

		let after;
		do {
			const request: HttpRequest = {
				method: HttpMethod.POST,
				url: 'https://api.hubapi.com/crm/v3/objects/deals/search',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.access_token,
				},
				body: {
					limit: 100,
					filterGroups: [
						{
							filters: [
								{
									propertyName: 'pipeline',
									operator: 'EQ',
									value: propsValue.pipelineId,
								},
								{ propertyName: 'dealstage', operator: 'EQ', value: propsValue.dealStageId },
							],
						},
					],
					sorts: [
						{
							propertyName: 'hs_lastmodifieddate',
							direction: 'DESCENDING',
						},
					],
					after: after,
				},
			};

			const response = await httpClient.sendRequest<SearchDealsResponse>(request);
			items.push(...response.body.results);
			after = response.body.paging?.next.after;
		} while (after !== undefined);
		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.updatedAt).valueOf(),
			data: item,
		}));
	},
};

export const dealStageUpdatedTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'deal_stage_updated',
	displayName: 'Updated Deal Stage',
	description: 'Triggers when a deal enters s specified stage.',
	props: {
		pipelineId: Property.Dropdown({
			displayName: 'Deal Pipeline',
			refreshers: [],
			required: true,
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: 'https://api.hubapi.com/crm/v3/pipelines/deals',
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};
				const response = await httpClient.sendRequest<ListDealPipelinesResponse>(request);
				return {
					disabled: false,
					options: response.body.results.map((pipeline) => {
						return {
							label: pipeline.label,
							value: pipeline.id,
						};
					}),
				};
			},
		}),
		dealstageId: Property.Dropdown({
			displayName: 'Deal Stage',
			refreshers: ['pipelineId'],
			required: true,
			options: async ({ auth, pipelineId }) => {
				if (!auth || !pipelineId) {
					return {
						disabled: true,
						placeholder: 'Please connect your account first and select pipeline.',
						options: [],
					};
				}
				const authValue = auth as PiecePropValueSchema<typeof hubspotAuth>;
				const request: HttpRequest = {
					method: HttpMethod.GET,
					url: `https://api.hubapi.com/crm/v3/pipelines/deals/${pipelineId}/stages`,
					authentication: {
						type: AuthenticationType.BEARER_TOKEN,
						token: authValue.access_token,
					},
				};
				const response = await httpClient.sendRequest<ListPipelineStagesResponse>(request);
				return {
					disabled: false,
					options: response.body.results.map((stage) => {
						return {
							label: stage.label,
							value: stage.id,
						};
					}),
				};
			},
		}),
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		const { store, auth, propsValue } = context;
		return await pollingHelper.test(polling, {
			store,
			auth,
			propsValue: {
				pipelineId: propsValue.pipelineId,
				dealStageId: propsValue.dealstageId,
			},
		});
	},
	async onEnable(context) {
		const { store, auth, propsValue } = context;
		await pollingHelper.onEnable(polling, {
			store,
			auth,
			propsValue: {
				pipelineId: propsValue.pipelineId,
				dealStageId: propsValue.dealstageId,
			},
		});
	},

	async onDisable(context) {
		const { store, auth, propsValue } = context;
		await pollingHelper.onDisable(polling, {
			store,
			auth,
			propsValue: {
				pipelineId: propsValue.pipelineId,
				dealStageId: propsValue.dealstageId,
			},
		});
	},

	async run(context) {
		const { store, auth, propsValue } = context;
		return await pollingHelper.poll(polling, {
			store,
			auth,
			propsValue: {
				pipelineId: propsValue.pipelineId,
				dealStageId: propsValue.dealstageId,
			},
		});
	},
	sampleData: {
		id: '18011922225',
		properties: {
			amount: null,
			closedate: '2024-03-31T11:28:32.089Z',
			createdate: '2024-03-13T11:28:40.586Z',
			dealname: 'Second Deal',
			dealstage: 'qualifiedtobuy',
			hs_lastmodifieddate: '2024-03-13T11:29:16.078Z',
			hs_object_id: '18011922225',
			pipeline: 'default',
		},
		createdAt: '2024-03-13T11:28:40.586Z',
		updatedAt: '2024-03-13T11:29:16.078Z',
		archived: false,
	},
});
