import { DEDUPE_KEY_PROPERTY, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { WEBHOOK_EVENTS } from '../common/constants';
import { smartSuiteApi } from '../common';
import { smartSuiteClient } from '../common/client';
import { smartSuiteWebhooks } from '../common/webhook';
import { outputSchemas } from '../output-schemas';

export const updatedRecord = createTrigger({
	name: 'updated_record',
	classification: 'READ',
	displayName: 'Updated Record',
	description: 'Triggers when a record is updated in the specified table.',
	aiMetadata: {
		description: 'Fires when an existing record is updated in the specified SmartSuite solution and table, delivering the changed record keyed by field label. Use to start a flow whenever a row in that table is modified.',
	},
	type: TriggerStrategy.WEBHOOK,
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
	},
	outputSchema: outputSchemas['labelledRecord'],

	async onEnable(context) {
		await smartSuiteWebhooks.enable({
			credentials: smartSuiteClient.credentialsOf(context.auth),
			store: context.store,
			storeKey: 'updated_record',
			solutionId: String(context.propsValue.solutionId),
			tableId: String(context.propsValue.tableId),
			kind: WEBHOOK_EVENTS.RECORD_UPDATED,
			webhookUrl: context.webhookUrl,
		});
	},

	async onDisable(context) {
		await smartSuiteWebhooks.disable({
			credentials: smartSuiteClient.credentialsOf(context.auth),
			store: context.store,
			storeKey: 'updated_record',
		});
	},

	async test(context) {
		const credentials = smartSuiteClient.credentialsOf(context.auth);
		const table = await smartSuiteApi.getTable({ credentials, tableId: context.propsValue.tableId });
		const page = await smartSuiteApi.listRecordsPage({
			credentials,
			tableId: context.propsValue.tableId,
			sort: [{ field: 'last_updated', direction: 'desc' }],
			limit: smartSuiteWebhooks.RECENT_RECORDS_LIMIT,
			offset: 0,
		});
		return page.items.map((item) => transformRecordFields({ tableSchema: table.structure, tableValues: item }));
	},

	async run(context) {
		const credentials = smartSuiteClient.credentialsOf(context.auth);
		if ((await smartSuiteWebhooks.ownNotificationWebhookId({ store: context.store, storeKey: 'updated_record', payload: context.payload.body })) === undefined) {
			return [];
		}
		const table = await smartSuiteApi.getTable({ credentials, tableId: context.propsValue.tableId });
		const events = await smartSuiteWebhooks.pullNewEvents({
			credentials,
			store: context.store,
			storeKey: 'updated_record',
			payload: context.payload.body,
			webhookUrl: context.webhookUrl,
		});
		if (events.length === 0) {
			return [];
		}
		return events.map((event) => ({
			...transformRecordFields({ tableSchema: table.structure, tableValues: smartSuiteWebhooks.recordOf(event) }),
			[DEDUPE_KEY_PROPERTY]: smartSuiteWebhooks.dedupeKeyOf(event),
		}));
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
