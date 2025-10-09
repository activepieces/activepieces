import { createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { pipedriveApiCall, pipedriveCommon } from '../common';
import { pipedriveAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

interface PipedriveActivityV2 {
	id: number;
	subject: string;
	owner_id: number;
	type: string;
	is_deleted: boolean;
	done: boolean;
	conference_meeting_client: string | null;
	conference_meeting_url: string | null;
	conference_meeting_id: string | null;
	due_date: string;
	due_time: string;
	duration: string;
	busy: boolean;
	add_time: string;
	update_time: string;
	marked_as_done_time: string | null;
	public_description: string | null;
	location: {
		value: string | null;
		street_number: string | null;
		route: string | null;
		sublocality: string | null;
		locality: string | null;
		admin_area_level_1: string | null;
		admin_area_level_2: string | null;
		country: string | null;
		postal_code: string | null;
		formatted_address: string | null;
	} | null;
	org_id: number | null;
	person_id: number | null;
	deal_id: number | null;
	lead_id: string | null;
	project_id: number | null;
	private: boolean;
	priority: number;
	note: string | null;
	creator_user_id: number;
	attendees?: {
		email_address: string;
		name: string;
		status: string;
		is_organizer: number;
		person_id: number | null;
		user_id: number | null;
	}[];
	participants?: {
		person_id: number;
		primary: boolean;
	}[];
}

interface ListActivitiesResponse {
	data: PipedriveActivityV2[];
}

export const newActivity = createTrigger({
	auth: pipedriveAuth,
	name: 'new_activity',
	displayName: 'New Activity',
	description: 'Triggers when a new activity is added',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'activity',
			'create',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<WebhookInformation>('_new_activity_trigger', {
			webhookId: webhook.data.id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>('_new_activity_trigger');
		if (response !== null && response !== undefined) {
			await pipedriveCommon.unsubscribeWebhook(
				response.webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const activities = [];

		const response = await pipedriveApiCall<LeadListResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/activities',
			query: {
				limit: 10,
				sort_by: 'update_time',
				sort_direction: 'desc',
				include_fields: 'attendees',
			},
		});

		if (isNil(response.data)) {
			return [];
		}

		for (const activity of response.data) {
			activities.push(activity);
		}

		return activities;
	},
	async run(context) {
		const payloadBody = context.payload.body as PayloadBody;

		const response = await pipedriveApiCall<{ data: PipedriveActivityV2 }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/v2/activities/${payloadBody.data.id}`,
			query: {
				include_fields: 'attendees',
			},
		});

		return [response.data];
	},
	sampleData: {
		id: 8,
		owner_id: 1234,
		done: false,
		type: 'deadline',
		due_date: '2020-06-09',
		due_time: '10:00',
		duration: '01:00',
		busy: true,
		add_time: '2020-06-08T12:37:56Z',
		marked_as_done_time: '2020-08-08T08:08:38Z',
		subject: 'Deadline',
		public_description: 'This is a description',
		location: {
			// Nested object
			value: 'Mustamäe tee 3, Tallinn, Estonia',
			street_number: '3',
			route: 'Mustamäe tee',
			sublocality: 'Kristiine',
			locality: 'Tallinn',
			admin_area_level_1: 'Harju maakond',
			admin_area_level_2: null,
			country: 'Estonia',
			postal_code: '10616',
			formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
		},
		org_id: 5,
		person_id: 1101,
		deal_id: 300,
		lead_id: '46c3b0e1-db35-59ca-1828-4817378dff71',
		is_deleted: false,
		update_time: '2020-08-08T12:37:56Z',
		note: 'A note for the activity',
		creator_user_id: 1234,
		attendees: [
			{
				email_address: 'attendee@pipedrivemail.com',
				is_organizer: 0,
				name: 'Attendee',
				person_id: 25312,
				status: 'noreply',
				user_id: null,
			},
		],
		participants: [
			{
				person_id: 17985,
				primary: false,
			},
			{
				person_id: 1101,
				primary: true,
			},
		],
	},
});

interface WebhookInformation {
	webhookId: string;
}

type PayloadBody = {
	data: PipedriveActivityV2;
	previous: PipedriveActivityV2;
	meta: {
		action: string;
		entity: string;
	};
};
