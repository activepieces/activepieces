import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveAuth } from '../../';
import {
	pipedriveApiCall,
	pipedriveCommon,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types';
import { isNil } from '@activepieces/shared';
import { PERSON_OPTIONAL_FIELDS } from '../common/constants';

interface PipedrivePersonV2 {
	id: number;
	name: string;
	first_name: string | null;
	last_name: string | null;
	owner_id: number;
	org_id: number | null;
	picture_id: number | null;
	add_time: string;
	update_time: string;
	is_deleted: boolean;
	visible_to: number;
	phones: {
		value: string;
		primary: boolean;
		label: string;
	}[];
	emails: {
		value: string;
		primary: boolean;
		label: string;
	}[];
	label_ids: number[];
	custom_fields: Record<string, unknown>;
	next_activity_id?: number | null;
	last_activity_id?: number | null;
	open_deals_count?: number;
	related_open_deals_count?: number;
	closed_deals_count?: number;
	related_closed_deals_count?: number;
	participant_open_deals_count?: number;
	participant_closed_deals_count?: number;
	email_messages_count?: number;
	activities_count?: number;
	done_activities_count?: number;
	undone_activities_count?: number;
	files_count?: number;
	notes_count?: number;
	followers_count?: number;
	won_deals_count?: number;
	related_won_deals_count?: number;
	lost_deals_count?: number;
	related_lost_deals_count?: number;
	last_incoming_mail_time?: string | null;
	last_outgoing_mail_time?: string | null;
	marketing_status?: string;
	doi_status?: string;
}

interface PersonListResponseV2 {
	data: PipedrivePersonV2[];
	additional_data?: {
		pagination?: {
			start: number;
			limit: number;
			more_items_in_collection: boolean;
			next_cursor?: string;
		};
	};
}

interface GetPersonResponseV2 {
	data: PipedrivePersonV2;
}

export const updatedPerson = createTrigger({
	auth: pipedriveAuth,
	name: 'updated_person',
	displayName: 'Updated Person',
	description: 'Triggers when a person is updated.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const webhook = await pipedriveCommon.subscribeWebhook(
			'person',
			'change',
			context.webhookUrl!,
			context.auth.data['api_domain'],
			context.auth.access_token,
		);
		await context.store?.put<string>('_updated_person_trigger', webhook.data.id);
	},

	async onDisable(context) {
		const webhookId = await context.store.get<string>('_updated_person_trigger');
		if (webhookId !== null && webhookId !== undefined) {
			await pipedriveCommon.unsubscribeWebhook(
				webhookId,
				context.auth.data['api_domain'],
				context.auth.access_token,
			);
		}
	},
	async test(context) {
		const personsResponse = await pipedriveApiCall<PersonListResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/persons',
			query: {
				limit: 5,
				sort_by: 'update_time',
				sort_direction: 'desc',
				include_fields: PERSON_OPTIONAL_FIELDS.join(','),
			},
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});

		if (isNil(personsResponse.data)) {
			return [];
		}

		const result = [];

		for (const person of personsResponse.data) {
			const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
			result.push(updatedPersonProperties);
		}

		return result;
	},
	async run(context) {
		const payloadBody = context.payload.body as {
			data: Record<string, any>;
			previous: Record<string, any>;
		};

		const personResponse = await pipedriveApiCall<GetPersonResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/v2/persons/${payloadBody.data.id}`,
			query: {
				include_fields: PERSON_OPTIONAL_FIELDS.join(','),
			},
		});

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});

		const updatedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			personResponse.data,
		);

		return [updatedPersonProperties];
	},
	sampleData: {
		id: 1,
		owner_id: 123,
		org_id: 1234,
		name: 'Will Smith',
		first_name: 'Will',
		last_name: 'Smith',
		is_deleted: false,
		phones: [
			{
				value: '12345',
				primary: true,
				label: 'work',
			},
		],
		emails: [
			{
				value: 'will.smith@example.com',
				primary: true,
				label: 'work',
			},
		],
		add_time: '2017-10-18T13:23:07Z',
		update_time: '2020-05-08T05:30:20Z',
		visible_to: 3,
		picture_id: 4,
		next_activity_id: 128,
		last_activity_id: 34,
		last_incoming_mail_time: '2019-05-29T18:21:42Z',
		last_outgoing_mail_time: '2019-05-30T03:45:35Z',
		label_ids: [1],
		marketing_status: 'no_consent',
	},
});
