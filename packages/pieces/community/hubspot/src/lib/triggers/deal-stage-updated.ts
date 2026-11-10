import {
	Property,
	Store,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getHubspotAccessToken, hubspotAuth } from '../auth';

import {
	getDefaultPropertiesForObject,
	pipelineDropdown,
	pipelineStageDropdown,
	standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { CrmSearchRequest, hubspotPolling } from '../common/polling';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import { crmObjectOutputSchema } from '../output-schemas';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
	pipelineId?: string;
	stageId?: string;
};

const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);
		const stageId = propsValue.stageId ?? '';
		const stageEnteredProperty = `hs_v2_date_entered_${stageId}`;
		const stageEntry = await checkStageEntryProperty({ client, store, stageId, propertyName: stageEnteredProperty });
		const tracksStageEntry = stageEntry.exists;
		const triggerProperties = [
			'dealstage',
			'pipeline',
			CURRENT_STAGE_ENTERED_PROPERTY,
			...(tracksStageEntry ? [stageEnteredProperty] : []),
		];
		const propertiesToRetrieve = [...defaultDealProperties, ...additionalProperties, ...triggerProperties];
		const search = (request: CrmSearchRequest) => client.crm.deals.searchApi.doSearch(request);

		if (tracksStageEntry) {
			const items = await hubspotPolling.pollSearchTrigger({
				store,
				search,
				timestampProperty: stageEnteredProperty,
				lastFetchEpochMS,
				properties: propertiesToRetrieve,
				testFilters: [{ propertyName: stageEnteredProperty, operator: FilterOperatorEnum.HasProperty }],
			});
			await stageEntry.remember();
			return items;
		}
		const inStage = [{ propertyName: 'dealstage', operator: FilterOperatorEnum.Eq, value: stageId }];
		const items = await hubspotPolling.pollSearchTrigger({
			store,
			search,
			timestampProperty: CURRENT_STAGE_ENTERED_PROPERTY,
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
			filters: inStage,
			testFilters: inStage,
		});
		await stageEntry.remember();
		return items;
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

async function checkStageEntryProperty({
	client,
	store,
	stageId,
	propertyName,
}: {
	client: Client;
	store: Store;
	stageId: string;
	propertyName: string;
}): Promise<{ exists: boolean; remember: () => Promise<void> }> {
	const cache = (await store.get<StageEntryCache>(STAGE_ENTRY_CACHE_KEY)) ?? {};
	const cached = cache[stageId];
	if (cached && (cached.exists || Date.now() - cached.checkedAt < MISSING_RECHECK_MS)) {
		return { exists: cached.exists, remember: async () => undefined };
	}
	const exists = await lookUpProperty({ client, propertyName });
	const remember = async () => {
		await store.put<StageEntryCache>(STAGE_ENTRY_CACHE_KEY, { ...cache, [stageId]: { exists, checkedAt: Date.now() } });
	};
	return { exists, remember };
}

async function lookUpProperty({ client, propertyName }: { client: Client; propertyName: string }): Promise<boolean> {
	try {
		await client.crm.properties.coreApi.getByName('deals', propertyName);
		return true;
	} catch (error) {
		if (isNotFound({ error })) {
			return false;
		}
		throw error;
	}
}

function isNotFound({ error }: { error: unknown }): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 404;
}

export const dealStageUpdatedTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'deal-stage-updated',
	classification: 'READ',
	displayName: 'Updated Deal Stage',
	description: 'Triggers when a deal enters a specified stage.',
	aiMetadata: {
		description:
			'Fires when a deal moves into the configured pipeline stage in HubSpot. Each event represents one deal that entered the selected stage since the last poll, returning the deal record with properties such as name, amount, close date, and stage entry date. Tracked by the date the deal entered the selected stage, so a deal that entered the stage and moved on before the next poll still fires (on custom pipelines without a per-stage date-entered property, only deals still in the stage are found).',
	},
	propertyGroups: [
		{
			key: 'pipeline',
			display: 'section',
			label: 'Pipeline',
			icon: 'sliders',
			props: ['pipelineId', 'stageId'],
		},
	],
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
			value: `Returned by default: dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id, dealstage, pipeline, hs_v2_date_entered_current_stage and hs_v2_date_entered_<selected stage>.

A deal that entered the stage and already moved on before the next check still triggers. On custom pipelines where HubSpot has no date-entered property for the stage, only deals still in the stage are found, so a deal that enters and leaves between checks may be missed.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	outputSchema: crmObjectOutputSchema,
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async test(context) {
		return hubspotPolling.sampleOldestToNewest({ items: await pollingHelper.test(polling, context) });
	},
	async run(context) {
		return await hubspotPolling.poll({ polling, context });
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

const CURRENT_STAGE_ENTERED_PROPERTY = 'hs_v2_date_entered_current_stage';
const STAGE_ENTRY_CACHE_KEY = 'dealStageEntryProperty';
const MISSING_RECHECK_MS = 24 * 60 * 60 * 1000;

type StageEntryCache = Record<string, { exists: boolean; checkedAt: number }>;
