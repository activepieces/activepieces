import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import { pipedriveApiCall, pipedrivePaginatedV2ApiCall } from '../common';
import { LeadListResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

export const activityMatchingFilterTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'activity-matching-filter',
	displayName: 'Activity Matching Filter',
	description: 'Trigges when an activity newly matches a Pipedrive filter for the first time.',
	type: TriggerStrategy.POLLING,
	props: {
		filterId: filterIdProp('activity', true),
	},
	async onEnable(context) {
		const ids: number[] = [];

		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/activities',
			query: { filter_id: context.propsValue.filterId },
		});

		if (!isNil(response)) {
			response.forEach((activity) => {
				ids.push(activity.id);
			});
		}
        
		await context.store.put('activities', JSON.stringify(ids));
	},
	async onDisable(context) {
		await context.store.delete('activities');
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
				filter_id: context.propsValue.filterId,
				sort_by:'update_time',
				sort_direction:'desc',
				include_fields:'attendees'
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
		const existingIds = (await context.store.get<string>('activities')) ?? '[]';
		const parsedExistingIds = JSON.parse(existingIds) as number[];

		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/activities',
			query: {  filter_id: context.propsValue.filterId,include_fields:'attendees'},
		});

		if (isNil(response) || response.length === 0) {
			return [];
		}

		// Filter valid activities
		const newActivities = response.filter((activity) => !parsedExistingIds.includes(activity.id));

		const newIds = newActivities.map((activity) => activity.id);

		if (newIds.length === 0) {
			return [];
		}

		// Store new IDs
		await context.store.put('activities', JSON.stringify([...newIds, ...parsedExistingIds]));

		return newActivities;
	},
	sampleData: {
		id: 8,
		company_id: 22122,
		user_id: 1234,
		done: false,
		type: 'deadline',
		reference_type: 'scheduler-service',
		reference_id: 7,
		conference_meeting_client: '871b8bc88d3a1202',
		conference_meeting_url: 'https://pipedrive.zoom.us/link',
		conference_meeting_id: '01758746701',
		due_date: '2020-06-09',
		due_time: '10:00',
		duration: '01:00',
		busy_flag: true,
		add_time: '2020-06-08 12:37:56',
		marked_as_done_time: '2020-08-08 08:08:38',
		last_notification_time: '2020-08-08 12:37:56',
		last_notification_user_id: 7655,
		notification_language_id: 1,
		subject: 'Deadline',
		public_description: 'This is a description',
		calendar_sync_include_context: '',
		location: 'Mustamäe tee 3, Tallinn, Estonia',
		org_id: 5,
		person_id: 1101,
		deal_id: 300,
		lead_id: '46c3b0e1-db35-59ca-1828-4817378dff71',
		active_flag: true,
		update_time: '2020-08-08 12:37:56',
		update_user_id: 5596,
		gcal_event_id: '',
		google_calendar_id: '',
		google_calendar_etag: '',
		source_timezone: '',
		rec_rule: 'RRULE:FREQ=WEEKLY;BYDAY=WE',
		rec_rule_extension: '',
		rec_master_activity_id: 1,
		series: [],
		note: 'A note for the activity',
		created_by_user_id: 1234,
		location_subpremise: '',
		location_street_number: '3',
		location_route: 'Mustamäe tee',
		location_sublocality: 'Kristiine',
		location_locality: 'Tallinn',
		location_admin_area_level_1: 'Harju maakond',
		location_admin_area_level_2: '',
		location_country: 'Estonia',
		location_postal_code: '10616',
		location_formatted_address: 'Mustamäe tee 3, 10616 Tallinn, Estonia',
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
				primary_flag: false,
			},
			{
				person_id: 1101,
				primary_flag: true,
			},
		],
		org_name: 'Organization',
		person_name: 'Person',
		deal_title: 'Deal',
		owner_name: 'Creator',
		person_dropbox_bcc: 'company@pipedrivemail.com',
		deal_dropbox_bcc: 'company+deal300@pipedrivemail.com',
		assigned_to_user_id: 1235,
		file: {
			id: '376892,',
			clean_name: 'Audio 10:55:07.m4a',
			url: 'https://pipedrive-files.s3-eu-west-1.amazonaws.com/Audio-recording.m4a',
		},
	},
});