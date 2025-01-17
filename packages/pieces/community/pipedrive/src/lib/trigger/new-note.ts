import { pipedriveAuth } from '../../';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { pipedriveApiCall, pipedrivePaginatedApiCall } from '../common';
import { LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof pipedriveAuth>, Record<string, unknown>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const notes = [];

		if (lastFetchEpochMS === 0) {
			const response = await pipedriveApiCall<LeadListResponse>({
				accessToken: auth.access_token,
				apiDomain: auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/notes',
				query: { limit: 10, sort: 'update_time DESC' },
			});

			if (isNil(response.data)) {
				return [];
			}

			for (const note of response.data) {
				notes.push(note);
			}
		} else {
			const response = await pipedrivePaginatedApiCall<Record<string, any>>({
				accessToken: auth.access_token,
				apiDomain: auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/notes',
				query: { sort: 'add_time DESC' },
			});
			if (isNil(response)) {
				return [];
			}

			for (const note of response) {
				notes.push(note);
			}
		}

		return notes.map((note) => {
			return {
				epochMilliSeconds: dayjs(note.add_time).valueOf(),
				data: note,
			};
		});
	},
};

export const newNoteTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'new-note',
	displayName: 'New Note',
	description: 'Triggers when a new note is created.',
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
		id: 1,
		user_id: 22701301,
		deal_id: null,
		person_id: 1,
		org_id: 1,
		lead_id: null,
		content: 'Note',
		add_time: '2024-12-04 06:48:26',
		update_time: '2024-12-04 06:48:26',
		active_flag: true,
		pinned_to_deal_flag: false,
		pinned_to_person_flag: false,
		pinned_to_organization_flag: false,
		pinned_to_lead_flag: false,
		last_update_user_id: null,
		organization: { name: 'Pipedrive' },
		person: { name: 'John' },
		deal: null,
		lead: null,
		user: { email: 'test@gmail.com', name: 'John', icon_url: null, is_you: true },
	},
});
