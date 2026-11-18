import { Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { hubspotPolling } from '../common/polling';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { OBJECT_TYPE } from '../common/constants';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';

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
		const defaultTaskProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TASK);
		const propertiesToRetrieve = [...defaultTaskProperties, ...additionalProperties];

		return hubspotPolling.pollSearchTrigger({
			store,
			search: (request) => client.crm.objects.tasks.searchApi.doSearch(request),
			timestampProperty: 'hs_createdate',
			lastFetchEpochMS,
			properties: propertiesToRetrieve,
		});
	},
} satisfies Polling<AppConnectionValueForAuthProperty<typeof hubspotAuth>, Props>;

export const newTaskTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-task',
	classification: 'READ',
	displayName: 'New Task',
	description: 'Triggers when a new task is created.',
	aiMetadata: {
		description:
			'Fires when a new task is created in the HubSpot CRM. Each event represents one task record (call, to-do, or email follow-up) with its properties such as subject, type, priority, owner, due timestamp, and associated contacts/companies/deals. Polls for tasks by creation date.',
	},
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: hs_task_body, hubspot_owner_id, hs_task_subject, hs_task_status, hs_task_priority, hs_task_type, hs_created_by, hs_repeat_status, hs_task_completion_date, hs_task_is_completed, hs_timestamp, hs_queue_membership_ids, hs_lastmodifieddate, hs_createdate.

Pick more below.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TASK,
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
		id: '18156543966',
		properties: {
			hs_created_by: '5605286',
			hs_createdate: '2023-06-13T09:42:37.557Z',
			hs_lastmodifieddate: '2023-06-13T10:03:41.073Z',
			hs_object_id: '18156543966',
			hs_repeat_status: null,
			hs_task_body: null,
			hs_task_completion_date: null,
			hs_task_is_completed: '0',
			hs_task_priority: 'NONE',
			hs_task_status: 'NOT_STARTED',
			hs_task_subject: 'My Test Task',
			hs_task_type: 'TODO',
			hs_queue_membership_ids: null,
			hubspot_owner_id: '1041576162',
			hs_timestamp: '2023-06-16T05:00:00Z',
		},
		createdAt: '2023-06-13T09:42:37.557Z',
		updatedAt: '2023-06-13T10:03:41.073Z',
		archived: false,
	},
});
