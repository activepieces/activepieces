import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import {
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { Client } from '@hubspot/api-client';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	propertyName?: string | string[];
};

import { crmObjectOutputSchema } from '../output-schemas';
const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });
		const propertyToCheck = propsValue.propertyName as string;
		const propertiesToRetrieve = [...getDefaultPropertiesForObject(OBJECT_TYPE.TICKET), propertyToCheck];

		return hubspotPolling.pollPropertyChanges({
			search: (request) => client.crm.tickets.searchApi.doSearch(request),
			readWithHistory: (request) => client.crm.tickets.batchApi.read(request),
			store,
			timestampProperty: 'hs_lastmodifieddate',
			watchedProperty: propertyToCheck,
			properties: propertiesToRetrieve,
			lastFetchEpochMS,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newTicketPropertyChangeTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-ticket-property-change',
	classification: 'READ',
	displayName: 'New Ticket Property Change',
	description: 'Triggers when a specified property is updated on a ticket.',
	aiMetadata: {
		description:
			'Fires when the chosen property changes on any HubSpot support ticket. Each event represents one ticket whose selected property was modified since the last poll, returning the ticket with its default properties (subject, pipeline, stage, priority, owner, etc.) and the watched property. Clearing the watched property also fires. Use to react to specific field updates rather than every ticket change.',
	},
	props: {
		propertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.TICKET,
				displayName: 'Property',
				required: true,
			},
			true,
			true,
		),
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
