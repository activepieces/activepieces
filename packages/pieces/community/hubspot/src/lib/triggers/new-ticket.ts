import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type Props = {
	additionalPropertiesToRetrieve?: string | string[];
};

import { crmObjectOutputSchema } from '../output-schemas';
const polling = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const client = new Client({ accessToken: getHubspotAccessToken(auth), numberOfApiCallRetries: 3 });

		const additionalProperties = propsValue.additionalPropertiesToRetrieve ?? [];
		const defaultTicketProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TICKET);
		const propertiesToRetrieve = [...defaultTicketProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.tickets.searchApi.doSearch(request),
			timestampProperty: 'createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newTicketTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-ticket',
	classification: 'READ',
	displayName: 'New Ticket',
	description: 'Triggers when a new ticket is created.',
	aiMetadata: {
		description:
			'Fires when a new support ticket is created in HubSpot. Polls the CRM tickets API for tickets sorted by creation date and emits each newly created ticket, including default ticket properties (subject, content, source type, pipeline, pipeline stage, priority, owner, etc.) plus any additional properties configured. Represents a freshly opened customer service case or request.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: subject, content, source_type, createdate, hs_pipeline, hs_pipeline_stage, hs_resolution, hs_ticket_category, hs_ticket_id, hs_ticket_priority, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TICKET,
			displayName: 'Additional Properties to Retrieve',
			required: false,
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
