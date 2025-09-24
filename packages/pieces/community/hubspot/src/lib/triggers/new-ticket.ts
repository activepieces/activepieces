import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import dayjs from 'dayjs';
import { hubspotAuth } from '../..';
import { MarkdownVariant } from '@activepieces/shared';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token, numberOfApiCallRetries: 3 });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);
		const propertiesToRetrieve = [...defaultTicketProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.tickets.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				properties: propertiesToRetrieve,
				after,
				sorts: ['-createdate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
									{
										propertyName: 'createdate',
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
			epochMilliSeconds: dayjs(item.properties['createdate']).valueOf(),
			data: item,
		}));
	},
};

export const newTicketTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-ticket',
	displayName: 'New Ticket',
	description: 'Trigger when new deal is available.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                                        
              subject, content, source_type, createdate, hs_pipeline, hs_pipeline_stage, hs_resolution, hs_ticket_category, hs_ticket_id, hs_ticket_priority, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id

              **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TICKET,
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
		createdAt: '2024-12-26T08:40:12.881Z',
		archived: false,
		id: '18166565782',
		properties: {
			content: null,
			createdate: '2024-12-26T08:40:12.881Z',
			hs_lastmodifieddate: '2024-12-26T08:40:14.245Z',
			hs_object_id: '18166565782',
			hs_pipeline: '0',
			hs_pipeline_stage: '1',
			hs_resolution: null,
			hs_ticket_category: null,
			hs_ticket_id: '18166565782',
			hs_ticket_priority: null,
			hubspot_owner_id: '1594636734',
			hubspot_team_id: '55094099',
			source_type: null,
			subject: 'test',
		},
		updatedAt: '2024-12-26T08:40:14.245Z',
	},
});
