import { hubspotAuth } from '../..';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { chunk } from '@activepieces/shared';

import { Client } from '@hubspot/api-client';
import dayjs from 'dayjs';
import { FilterOperatorEnum } from '../common/types';

type Props = {
	propertyName?: string | string[];
};

const polling: Polling<PiecePropValueSchema<typeof hubspotAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = new Client({ accessToken: auth.access_token });

		const propertyToCheck = propsValue.propertyName as string;

		const propertiesToRetrieve = [propertyToCheck];

		const items = [];
		// For test, we only fetch 10 tickets
		if (lastFetchEpochMS === 0) {
			const response = await client.crm.tickets.searchApi.doSearch({
				limit: 10,
				properties: propertiesToRetrieve,
				sorts: ['-hs_lastmodifieddate'],
			});
			items.push(...response.results);
			return items.map((item) => ({
				epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
				data: item,
			}));
		}
		//fetch updated tickets
		const updatedTickets = [];
		let after;
		do {
			const response = await client.crm.tickets.searchApi.doSearch({
				limit: 100,
				sorts: ['-hs_lastmodifieddate'],
				after,
				filterGroups: [
					{
						filters: [
							{
								propertyName: propertyToCheck,
								operator: FilterOperatorEnum.HasProperty,
							},
							{
								propertyName: 'hs_lastmodifieddate',
								operator: FilterOperatorEnum.Gt,
								value: lastFetchEpochMS.toString(),
							},
						],
					},
				],
			});
			after = response.paging?.next?.after;
			updatedTickets.push(...response.results);
		} while (after);

		if (updatedTickets.length === 0) {
			return [];
		}

    // Avoid VALIDATION_ERROR: The maximum number of inputs supported in a batch request for property histories is 50
    const batchApiChunks = chunk(updatedTickets, 50);

    // Fetch tickets with property history
    const batchApiResps = await Promise.all(
      batchApiChunks.map((batch) => {
        return client.crm.tickets.batchApi.read({
          propertiesWithHistory: [propertyToCheck],
          properties: propertiesToRetrieve,
          inputs: batch.map((ticket) => {
            return {
              id: ticket.id,
            };
          }),
        });
      })
    );

    const updatedTicketsWithPropertyHistory = batchApiResps.flatMap(
      (resp) => resp.results
    );

		for (const ticket of updatedTicketsWithPropertyHistory) {
			const history = ticket.propertiesWithHistory?.[propertyToCheck];
			if (!history || history.length === 0) {
				continue;
			}
			const propertyLastModifiedDateTimeStamp = dayjs(history[0].timestamp).valueOf();
			if (propertyLastModifiedDateTimeStamp > lastFetchEpochMS) {
				const { propertiesWithHistory, ...item } = ticket;
				items.push(item);
			}
		}

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.properties['hs_lastmodifieddate']).valueOf(),
			data: item,
		}));
	},
};

export const newTicketPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-ticket-property-change',
	displayName: 'New Ticket Property Change',
	description: 'Triggers when a specified property is updated on a ticket.',
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'Property Name',
				required: true,
			},
			true,
			true,
		),
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
		createdAt: '2024-12-21T14:23:38.368Z',
		archived: false,
		id: '18092693102',
		properties: {
			content: null,
			createdate: '2024-12-21T14:23:38.368Z',
			hs_lastmodifieddate: '2024-12-26T08:11:34.374Z',
			hs_object_id: '18092693102',
			hs_pipeline: '0',
			hs_pipeline_stage: '1',
			hs_resolution: 'ISSUE_FIXED',
			hs_ticket_category: null,
			hs_ticket_id: '18092693102',
			hs_ticket_priority: null,
			hubspot_owner_id: null,
			hubspot_team_id: null,
			source_type: null,
			subject: 'NEW',
		},
		updatedAt: '2024-12-26T08:11:34.374Z',
	},
});
