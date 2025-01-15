import { pipedriveAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField, LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof pipedriveAuth>, Record<string, unknown>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const leads = [];

		if (lastFetchEpochMS === 0) {
			const response = await pipedriveApiCall<LeadListResponse>({
				accessToken: auth.access_token,
				apiDomain: auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/leads',
				query: { limit: 10, sort: 'update_time DESC' },
			});

			if (isNil(response.data)) {
				return [];
			}

			for (const lead of response.data) {
				leads.push(lead);
			}
		} else {
			const response = await pipedrivePaginatedApiCall<Record<string, any>>({
				accessToken: auth.access_token,
				apiDomain: auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/leads',
				query: { sort: 'add_time DESC' },
			});
			if (isNil(response)) {
				return [];
			}

			for (const lead of response) {
				leads.push(lead);
			}
		}

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: auth.access_token,
			apiDomain: auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const items = [];

		for (const lead of leads) {
			const updatedLeadProperties = pipedriveTransformCustomFields(customFieldsResponse, lead);
			items.push(updatedLeadProperties);
		}

		return items.map((lead) => {
			return {
				epochMilliSeconds: dayjs(lead.add_time).valueOf(),
				data: lead,
			};
		});
	},
};

export const newLeadTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'new-lead',
	displayName: 'New Lead',
	description: 'Triggers when a new lead is created.',
	props: {},
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
		id: 'f3c23480-c9b1-11ef-bc83-2b8218e028ef',
		title: 'Test lead',
		owner_id: 22701301,
		creator_id: 22701301,
		label_ids: ['a0e5f330-d2a7-4181-a6e3-a44d634b7bf7', '8a0e6918-1eee-4e56-a615-c81d712a6a77'],
		value: null,
		expected_close_date: null,
		person_id: 2,
		organization_id: 1,
		is_archived: false,
		source_name: 'Manually created',
		origin: 'ManuallyCreated',
		origin_id: null,
		channel: 1,
		channel_id: null,
		was_seen: true,
		next_activity_id: null,
		add_time: '2025-01-03T09:06:00.776Z',
		update_time: '2025-01-03T09:06:00.776Z',
		visible_to: '3',
	},
});
