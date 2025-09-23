import { PiecePropValueSchema, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { hubspotAuth } from '../..';
import { MarkdownVariant } from '@activepieces/shared';
import { OBJECT_TYPE } from '../common/constants';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';

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
		const defaultTaskProperties = getDefaultPropertiesForObject(OBJECT_TYPE.TASK);
		const propertiesToRetrieve = [...defaultTaskProperties, ...additionalProperties];

		const items = [];
		let after;

		do {
			const isTest = lastFetchEpochMS === 0;
			const response = await client.crm.objects.tasks.searchApi.doSearch({
				limit: isTest ? 10 : 100,
				after,
				properties: propertiesToRetrieve,
				sorts: ['-hs_createdate'],
				filterGroups: isTest
					? []
					: [
							{
								filters: [
									{
										propertyName: 'hs_createdate',
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
			epochMilliSeconds: dayjs(item.properties['hs_createdate']).valueOf(),
			data: item,
		}));
	},
};

export const newTaskTrigger = createTrigger({
	auth: hubspotAuth,
	name: 'new-task',
	displayName: 'New Task',
	description: 'Trigger when a new task is added.',
	props: {
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
                                                        
					hs_task_subject, hs_task_type, hs_task_priority, hubspot_owner_id, hs_timestamp, hs_queue_membership_ids, hs_lastmodifieddate,hs_createdate

                    **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.TASK,
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
		results: [
			{
				id: '18156543966',
				properties: {
					hs_created_by: '5605286',
					hs_created_by_user_id: '5605286',
					hs_createdate: '2023-06-13T09:42:37.557Z',
					hs_modified_by: '5605286',
					hs_num_associated_companies: '0',
					hs_num_associated_contacts: '1',
					hs_num_associated_deals: '0',
					hs_num_associated_tickets: '0',
					hs_product_name: null,
					hs_read_only: null,
					hs_repeat_status: null,
					hs_task_body: null,
					hs_task_completion_count: '0',
					hs_task_completion_date: null,
					hs_task_is_all_day: 'false',
					hs_task_is_completed: '0',
					hs_task_is_completed_call: '0',
					hs_task_is_completed_email: '0',
					hs_task_is_completed_linked_in: '0',
					hs_task_is_completed_sequence: '0',
					hs_task_repeat_interval: null,
					hs_task_status: 'NOT_STARTED',
					hs_task_subject: 'My Test Task',
					hs_task_type: 'TODO',
					hs_updated_by_user_id: '5605286',
					hubspot_owner_id: '1041576162',
					hs_timestamp: '2023-06-16T05:00:00Z',
				},
				createdAt: '2023-06-13T09:42:37.557Z',
				updatedAt: '2023-06-13T10:03:41.073Z',
				archived: false,
			},
		],
	},
});
