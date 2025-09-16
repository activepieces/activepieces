import {
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import dayjs from 'dayjs';

import { hubspotAuth } from '../../';

import {
	getDefaultPropertiesForObject,
	pipelineDropdown,
	pipelineStageDropdown,
	standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
	pipelineId?: string;
	stageId?: string;
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);
		const triggerProperties = ['hs_v2_date_entered_current_stage'];
		const propertiesToRetrieve = [...defaultDealProperties, ...additionalProperties, ...triggerProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.deals.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				properties: propertiesToRetrieve,
				sorts: ['-hs_v2_date_entered_current_stage'],
				after,
				filterGroups: [
					{
						filters: [
							{
								propertyName: 'pipeline',
								operator: FilterOperatorEnum.Eq,
								value: propsValue.pipelineId,
							},
							{
								propertyName: 'dealstage',
								operator: FilterOperatorEnum.Eq,
								value: propsValue.stageId,
							},
							{
								propertyName: 'hs_v2_date_entered_current_stage',
								operator: FilterOperatorEnum.Gt,
								value: lastFetchEpochMS.toString(),
							},
						],
					},
				],
			});
			after = response.paging?.next?.after;
			items.push(...response.results);

			// Stop fetching if it's a test
			if (isTest) break;
		} while (after);

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['hs_v2_date_entered_current_stage']).valueOf(),
			data: item,
		}));
	},
};

export const dealStageUpdatedTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'deal-stage-updated',
	displayName: 'Updated Deal Stage',
	description: 'Triggers when a deal enters a specified stage.',
	props: {
		pipelineId: pipelineDropdown({
			objectType: OBJECT_TYPE.DEAL,
			required: true,
			displayName: 'Deal Pipeline',
		}),
		stageId: pipelineStageDropdown({
			objectType: OBJECT_TYPE.DEAL,
			required: true,
			displayName: 'Deal Stage',
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
																
							dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id, hs_v2_date_entered_current_stage
									
							**Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
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
			hs_v2_date_entered_current_stage: '2024-03-13T11:29:16.078Z',
		},
		createdAt: '2024-03-13T11:28:40.586Z',
		updatedAt: '2024-03-13T11:29:16.078Z',
		archived: false,
	},
});
