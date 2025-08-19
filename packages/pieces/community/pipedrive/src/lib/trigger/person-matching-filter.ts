import { pipedriveAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { filterIdProp } from '../common/props';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedrivePaginatedV2ApiCall,
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

export const personMatchingFilterTrigger = createTrigger({
	auth: pipedriveAuth,
	name: 'person-matching-filter',
	displayName: 'Person Matching Filter',
	description: 'Triggers when a person newly matches a Pipedrive filter for the first time.',
	type: TriggerStrategy.POLLING,
	props: {
		filterId: filterIdProp('people', true),
	},
	async onEnable(context) {
		const ids: number[] = [];
		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/persons',
			query: {
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
			},
		});
		if (!isNil(response)) {
			response.forEach((person) => {
				ids.push(person.id);
			});
		}
		await context.store.put('persons', JSON.stringify(ids));
	},
	async onDisable(context) {
		await context.store.delete('persons');
	},
	async test(context) {
		const persons = [];
		const response = await pipedriveApiCall<PersonListResponseV2>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/persons',
			query: {
				limit: 10,
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
				include_fields: PERSON_OPTIONAL_FIELDS.join(','),
			},
		});
		if (isNil(response.data)) {
			return [];
		}
		for (const person of response.data) {
			persons.push(person);
		}
		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});
		const result = [];
		for (const person of persons) {
			const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
			result.push(updatedPersonProperties);
		}
		return result;
	},
	async run(context) {
		const existingIds = (await context.store.get<string>('persons')) ?? '[]';
		const parsedExistingIds = JSON.parse(existingIds) as number[];

		const response = await pipedrivePaginatedV2ApiCall<{ id: number }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/persons',
			query: {
				sort_by: 'update_time',
				sort_direction: 'desc',
				filter_id: context.propsValue.filterId,
				include_fields: PERSON_OPTIONAL_FIELDS.join(','),
			},
		});
		if (isNil(response) || response.length === 0) {
			return [];
		}
		const newPersons = response.filter((person) => !parsedExistingIds.includes(person.id));
		const newIds = newPersons.map((person) => person.id);

		if (newIds.length === 0) {
			return [];
		}

		await context.store.put('persons', JSON.stringify([...newIds, ...parsedExistingIds]));
		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/personFields',
		});
		const result = [];
		for (const person of newPersons) {
			const updatedPersonProperties = pipedriveTransformCustomFields(customFieldsResponse, person);
			result.push(updatedPersonProperties);
		}
		return result;
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
