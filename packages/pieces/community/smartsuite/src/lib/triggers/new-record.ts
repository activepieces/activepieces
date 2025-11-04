import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { SMARTSUITE_WEBHOOKS_API_URL, API_ENDPOINTS, WEBHOOK_EVENTS } from '../common/constants';
import { smartSuiteApiCall, TableStucture } from '../common';

export const newRecord = createTrigger({
	name: 'new_record',
	displayName: 'New Record',
	description: 'Triggers when a new record is created in the specified table',
	type: TriggerStrategy.WEBHOOK,
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
	},

	async onEnable(context) {
		const { solutionId, tableId } = context.propsValue;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.CREATE_WEBHOOK}`,
			body: {
				webhook: {
					filter: {
						applications: {
							application_ids: [tableId],
						},
					},
					kinds: [WEBHOOK_EVENTS.RECORD_CREATED],
					locator: {
						account_id: context.auth.accountId, // This will be filled by SmartSuite based on the API key
						solution_id: solutionId,
					},
					notification_status: {
						enabled: {
							url: context.webhookUrl,
						},
					},
				},
			},
			headers: {
				Authorization: `Token ${context.auth.apiKey}`,
				'ACCOUNT-ID': context.auth.accountId,
			},
		});
		await context.store.put('new_record', response.body.webhook.webhook_id);
	},

	async onDisable(context) {
		const webhookId = await context.store.get('new_record');

		if (webhookId) {
			await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.DELETE_WEBHOOK}`,
				body: {
					webhook_id: webhookId,
				},
				headers: {
					Authorization: `Token ${context.auth.apiKey}`,
					'ACCOUNT-ID': context.auth.accountId,
				},
			});
		}
	},

	async test(context) {
		const { tableId } = context.propsValue;
		const response = await smartSuiteApiCall<{ items: Record<string, any>[] }>({
			accountId: context.auth.accountId,
			apiKey: context.auth.apiKey,
			method: HttpMethod.POST,
			resourceUri: `/applications/${tableId}/records/list/`,
			query: { limit: '5', offset: '0' },
		});
		const items = response.items || [];

		const tableResponse = await smartSuiteApiCall<{
			structure: TableStucture[];
		}>({
			apiKey: context.auth.apiKey,
			accountId: context.auth.accountId,
			method: HttpMethod.GET,
			resourceUri: `/applications/${context.propsValue.tableId}`,
		});
		const tableSchema = tableResponse.structure;

		return items.map((item) => transformRecordFields(tableSchema, item));
	},

	async run(context) {
		const webhookPayload = context.payload.body as {
			webhookId: string;
			locator: {
				accountId: string;
				solutionId: string;
			};
		};

		let pageToken = (await context.store.get('pageToken')) ?? '';

		if (!webhookPayload || !webhookPayload.webhookId || !webhookPayload.locator) {
			return [];
		}

		const events = [];

		let hasMore = true;

		do {
			const response = await httpClient.sendRequest<{
				events: { record_event_data: { data: Record<string, any> } }[];
				next_page_token: string;
			}>({
				method: HttpMethod.POST,
				url: `${SMARTSUITE_WEBHOOKS_API_URL}${API_ENDPOINTS.LIST_EVENTS}`,
				body: {
					webhook_id: webhookPayload.webhookId,
					page_size: '50',
					page_token: pageToken,
				},
				headers: {
					Authorization: `Token ${context.auth.apiKey}`,
					'ACCOUNT-ID': context.auth.accountId,
				},
			});

			pageToken = response.body.next_page_token;

			const items = response.body.events ?? [];

			events.push(...items);

			hasMore = items.length > 0;
		} while (hasMore);

		await context.store.put('pageToken', pageToken);

		const tableResponse = await smartSuiteApiCall<{
			structure: TableStucture[];
		}>({
			apiKey: context.auth.apiKey,
			accountId: context.auth.accountId,
			method: HttpMethod.GET,
			resourceUri: `/applications/${context.propsValue.tableId}`,
		});
		const tableSchema = tableResponse.structure;

		return events.map((event) => transformRecordFields(tableSchema, event.record_event_data.data));
	},

	sampleData: {
		Title: 'First Record',
		Description: {
			data: {
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						attrs: {
							textAlign: 'left',
							size: 'medium',
						},
						content: [
							{
								type: 'text',
								text: 'xxzxzxzxzxz',
							},
						],
					},
					{
						type: 'paragraph',
						attrs: {
							textAlign: 'left',
							size: 'medium',
						},
						content: [
							{
								type: 'text',
								text: 'xzxzxz',
							},
						],
					},
					{
						type: 'paragraph',
						attrs: {
							textAlign: 'left',
							size: 'medium',
						},
						content: [
							{
								type: 'text',
								text: 'xzxz',
							},
						],
					},
				],
			},
			html: '<div class="rendered"><p class="align-left" >xxzxzxzxzxz</p><p class="align-left" >xzxzxz</p><p class="align-left" >xzxz</p></div>',
			preview: 'xxzxzxzxzxz\n xzxzxz\n xzxz',
			yjsData: '',
		},
		Status: {
			value: 'backlog',
			updated_on: '2025-05-25T14:52:17.110000Z',
		},
		'First Created': {
			on: '2025-05-25T14:52:16.977000Z',
			by: '682c72c82336bf787bb5c7a0',
		},
		'Last Updated': {
			on: '2025-05-26T10:52:14.987027Z',
			by: '682c72c82336bf787bb5c7a0',
		},
		'Followed by': [],
		'Open Comments': 0,
		'Auto Number': 1,
		'text-field': 'text',
		'Text Area': 'area',
		Number: '12.0',
		'Number Slider': 33,
		Percent: '12.0',
		Currency: '12',
		'Yes / No': true,
		'Single Select': '3u0Cl',
		'Multiple Select': ['bZfFn', 'LvQIv'],
		Date: {
			date: '2025-05-30T00:00:00Z',
			include_time: false,
		},
		'Full Name': {
			title: '',
			first_name: 'john',
			middle_name: '',
			last_name: 'doe',
			sys_root: 'john doe',
		},
		Email: ['johndoe@gmail.com'],
		Phone: [
			{
				phone_country: 'IN',
				phone_number: '',
				phone_extension: '',
				phone_type: 2,
				sys_root: '',
				sys_title: '',
			},
		],
		Address: {
			location_address: '',
			location_address2: '',
			location_zip: '',
			location_country: '',
			location_state: '',
			location_city: '',
			location_longitude: '72.2',
			location_latitude: '21.12',
			sys_root: '',
		},
		Link: ['https://github.com'],
		'Files and Images': [
			{
				handle: 'CeRMEqhySiFboDMkiZlx',
				metadata: {
					container: 'smart-suite-media',
					filename: 'spotify.png',
					key: 'PAfWmgwRnOhw6KJygepi_spotify.png',
					mimetype: 'image/png',
					size: 23422,
				},
				transform_options: {},
				created_on: '2025-05-26T10:47:12.586000Z',
				updated_on: '2025-05-26T10:47:12.586000Z',
				description: '',
				video_conversion_status: '',
				video_thumbnail_handle: '',
				converted_video_handle: '',
				file_type: 'image',
				icon: 'image',
			},
			{
				handle: 'GUQyUrvYQrpswR97N8jT',
				metadata: {
					container: 'smart-suite-media',
					filename: 'zagomail.png',
					key: 'CSHRsjZRVS6HIFvJEfqQ_zagomail.png',
					mimetype: 'image/png',
					size: 96995,
				},
				transform_options: {},
				created_on: '2025-05-26T10:49:41.891000Z',
				updated_on: '2025-05-26T10:49:41.891000Z',
				description: '',
				video_conversion_status: '',
				video_thumbnail_handle: '',
				converted_video_handle: '',
				file_type: 'image',
				icon: 'image',
			},
			{
				handle: 'eUhDadE9Q3yFz3XLCEgC',
				metadata: {
					container: 'smart-suite-media',
					filename: 'coda.png',
					key: 'BrE3gQheS108HgFd1HYT_coda.png',
					mimetype: 'image/png',
					size: 880,
				},
				transform_options: {},
				created_on: '2025-05-26T10:52:14.981371Z',
				updated_on: '2025-05-26T10:52:14.981377Z',
				description: '',
				video_conversion_status: '',
				video_thumbnail_handle: '',
				converted_video_handle: '',
				file_type: 'image',
				icon: 'image',
			},
		],
		SmartDoc: {
			data: {},
			html: '',
			preview: '',
			yjsData: 'AAA=',
		},
		'Link to Tasks': ['682c72c84386b2737cab1bd0', '682c72c84386b2737cab1bcf'],
		Time: '00:15:00',
		'Date Range': {
			from_date: {
				date: '2025-05-25T00:00:00Z',
				include_time: false,
			},
			to_date: {
				date: '2025-05-29T00:00:00Z',
				include_time: false,
			},
		},
		'Percent Complete': 43,
		'Status 1': {
			value: 'backlog',
			updated_on: '2025-05-25T14:52:17.111000Z',
		},
		'Due Date': {
			from_date: {
				date: null,
				include_time: false,
			},
			to_date: {
				date: '2025-05-30T00:00:00Z',
				include_time: false,
			},
			status_is_completed: false,
			status_updated_on: '2025-05-25T14:52:17.110000Z',
		},
		'Assigned To': ['682c72c82336bf787bb5c7a0'],
		Duration: '60.0',
		'Time Tracking Log': {
			time_track_logs: [],
			total_duration: 0,
		},
		Checklist: {
			items: [
				{
					id: 'f93c6845-5823-4d73-945c-f10038125ae1',
					content: {
						data: {
							type: 'doc',
							content: [
								{
									type: 'paragraph',
									attrs: {
										textAlign: 'left',
										size: 'medium',
									},
									content: [
										{
											type: 'text',
											text: 'ss',
										},
									],
								},
							],
						},
						html: '<div class="rendered"><p class="align-left" >ss</p></div>',
						preview: 'ss',
					},
					completed: false,
					assignee: null,
					due_date: null,
					completed_at: null,
				},
			],
			total_items: 1,
			completed_items: 0,
		},
		Rating: 5,
		Vote: {
			total_votes: 0,
			votes: [],
		},
		Tag: ['68333302894412d3ffa5f55a'],
		'Record ID': '68332ea07e87b585dca5f3da',
		Signature: {
			text: '',
			image_base64: '',
		},
		Count: '2',
		'Sub-Items': {
			count: 0,
			items: [],
		},
		Button: null,
		'Color Picker': [
			{
				value: '#715E5E',
			},
		],
		'IP Address': [
			{
				address: '192.121.0.0',
				country_code: 'gb',
			},
		],
		Rollup: '9.0',
		Lookup: [['Phase Gate'], ['Market Research and Design Conceptualization']],
		id: '68332ea07e87b585dca5f3da',
		application_slug: 'sc4keiie',
		application_id: '682c745daf3f33a521fc8c8c',
		ranking: {
			default: 'aaaaaaaouq',
		},
		deleted_date: {
			date: null,
			include_time: false,
		},
		deleted_by: null,
	},
});
