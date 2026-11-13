import { activeCampaignAuth } from '../auth';
import { DropdownOption, InputPropertyMap, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { ActiveCampaignClient } from './client';
import { CUSTOM_FIELD_TYPE } from './constants';
import { UnknownRecord, acData } from './types';

export function makeClient(auth: PiecePropValueSchema<typeof activeCampaignAuth>): ActiveCampaignClient {
	return new ActiveCampaignClient({ apiUrl: auth.apiUrl, apiKey: auth.apiKey });
}

function recordDropdown<R extends boolean>({ displayName, description, required, refreshers = [], load }: RecordDropdownParams<R>) {
	return Property.Dropdown<string, R, typeof activeCampaignAuth>({
		auth: activeCampaignAuth,
		displayName,
		description,
		required,
		refreshers,
		refreshOnSearch: true,
		options: async (propsValue, ctx) => {
			const auth = propsValue.auth;
			if (!auth) {
				return { disabled: true, placeholder: 'Please connect your account first', options: [] };
			}
			const search = ctx.searchValue?.trim() || undefined;
			try {
				const { options, total, placeholder } = await load({ client: makeClient(auth.props), search, propsValue });
				if (placeholder !== undefined) {
					return { disabled: true, placeholder, options: [] };
				}
				const truncated = total !== undefined && total > options.length;
				return {
					disabled: false,
					options,
					placeholder: truncated ? `Showing ${options.length} of ${total}. Type to search for the others.` : undefined,
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return { disabled: true, placeholder: `Could not load ${displayName.toLowerCase()}: ${message}`, options: [] };
			}
		},
	});
}

function option({ record, label }: { record: UnknownRecord; label: string | undefined }): DropdownOption<string> {
	const id = acData.textAt({ value: record, key: 'id' }) ?? '';
	return { label: label && label.trim() !== '' ? label : `#${id}`, value: id };
}

function contactLabel(contact: UnknownRecord): string | undefined {
	const first = acData.textAt({ value: contact, key: 'firstName' }) ?? '';
	const last = acData.textAt({ value: contact, key: 'lastName' }) ?? '';
	const email = acData.textAt({ value: contact, key: 'email' }) ?? '';
	const name = `${first} ${last}`.trim();
	if (name !== '' && email !== '') {
		return `${name} (${email})`;
	}
	return name !== '' ? name : email;
}

function filterBySearch({ options, search }: { options: DropdownOption<string>[]; search: string | undefined }): DropdownOption<string>[] {
	if (search === undefined) {
		return options;
	}
	const needle = search.toLowerCase();
	return options.filter((item) => item.label.toLowerCase().includes(needle));
}

async function loadContacts({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listContacts({ search });
	return { options: page.items.map((record) => option({ record, label: contactLabel(record) })), total: page.total };
}

async function loadAccounts({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listAccounts({ search });
	return { options: page.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'name' }) })), total: page.total };
}

async function loadTags({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listTags({ search });
	return { options: page.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'tag' }) })), total: page.total };
}

async function loadLists({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listContactLists({ search });
	return { options: page.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'name' }) })), total: page.total };
}

async function loadPipelines({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listPage({ path: '/dealGroups', key: 'dealGroups', query: { 'filters[title]': search }, limit: 100, offset: 0 });
	return { options: page.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'title' }) })), total: page.total };
}

async function loadStages({ client, search, propsValue }: LoadParams): Promise<LoadResult> {
	const pipelineId = propsValue['pipelineId'];
	if (typeof pipelineId !== 'string' || pipelineId === '') {
		return { options: [], placeholder: 'Select a pipeline first' };
	}
	const all = await client.listAll({ path: '/dealStages', key: 'dealStages', query: { 'filters[d_groupid]': pipelineId } });
	const options = all.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'title' }) }));
	return { options: filterBySearch({ options, search }) };
}

async function loadUsers({ client, search }: LoadParams): Promise<LoadResult> {
	const all = await client.listAll({ path: '/users', key: 'users' });
	const options = all.items.map((record) => {
		const name = `${acData.textAt({ value: record, key: 'firstName' }) ?? ''} ${acData.textAt({ value: record, key: 'lastName' }) ?? ''}`.trim();
		return option({ record, label: name !== '' ? name : acData.textAt({ value: record, key: 'username' }) });
	});
	return { options: filterBySearch({ options, search }) };
}

async function loadDeals({ client, search }: LoadParams): Promise<LoadResult> {
	const page = await client.listPage({ path: '/deals', key: 'deals', query: { 'filters[search]': search }, limit: 100, offset: 0 });
	return { options: page.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'title' }) })), total: page.total };
}

async function loadTaskTypes({ client, search }: LoadParams): Promise<LoadResult> {
	const all = await client.listAll({ path: '/dealTasktypes', key: 'dealTasktypes' });
	const options = all.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'title' }) }));
	return { options: filterBySearch({ options, search }) };
}

async function loadAutomations({ client, search }: LoadParams): Promise<LoadResult> {
	const all = await client.listAll({ path: '/automations', key: 'automations' });
	const options = all.items.map((record) => option({ record, label: acData.textAt({ value: record, key: 'name' }) }));
	return { options: filterBySearch({ options, search }) };
}

function stringOptions(values: unknown): DropdownOption<string>[] {
	if (!Array.isArray(values)) {
		return [];
	}
	return values.filter((value): value is string => typeof value === 'string').map((value) => ({ label: value, value }));
}

function customFieldProp({ type, displayName, options }: { type: string | undefined; displayName: string; options: DropdownOption<string>[] }): InputPropertyMap[string] | undefined {
	switch (type) {
		case CUSTOM_FIELD_TYPE.TEXT:
		case CUSTOM_FIELD_TYPE.HIDDEN:
			return Property.ShortText({ displayName, required: false });
		case CUSTOM_FIELD_TYPE.TEXTAREA:
			return Property.LongText({ displayName, required: false });
		case CUSTOM_FIELD_TYPE.DATE:
			return Property.DateTime({ displayName, description: 'Please use YYYY-MM-DD format.', required: false });
		case CUSTOM_FIELD_TYPE.DATETIME:
			return Property.DateTime({ displayName, required: false });
		case CUSTOM_FIELD_TYPE.MONEY:
		case CUSTOM_FIELD_TYPE.NUMBER:
			return Property.Number({ displayName, required: false });
		case CUSTOM_FIELD_TYPE.DROPDOWN:
		case CUSTOM_FIELD_TYPE.RADIO:
			return Property.StaticDropdown({ displayName, required: false, options: { disabled: false, options } });
		case CUSTOM_FIELD_TYPE.CHECKBOX:
		case CUSTOM_FIELD_TYPE.LIST_BOX:
		case CUSTOM_FIELD_TYPE.MULTISELECT:
			return Property.StaticMultiSelectDropdown({ displayName, required: false, options: { disabled: false, options } });
		default:
			return undefined;
	}
}

export const activecampaignCommon = {
	listId: <R extends boolean>(required: R) =>
		recordDropdown({ displayName: 'List', description: 'Type to search lists by name.', required, load: loadLists }),
	accountId: recordDropdown({ displayName: 'Account ID', description: 'Type to search accounts by name.', required: true, load: loadAccounts }),
	optionalAccountId: recordDropdown({ displayName: 'Account', description: 'Type to search accounts by name.', required: false, load: loadAccounts }),
	contactId: recordDropdown({ displayName: 'Contact ID', description: 'Type to search contacts by name or email.', required: true, load: loadContacts }),
	optionalContactId: recordDropdown({ displayName: 'Contact', description: 'Type to search contacts by name or email.', required: false, load: loadContacts }),
	tagId: recordDropdown({ displayName: 'Tag ID', description: 'Type to search tags by name.', required: true, load: loadTags }),
	pipelineId: <R extends boolean>(required: R) =>
		recordDropdown({ displayName: 'Pipeline', description: 'The deal pipeline.', required, load: loadPipelines }),
	stageId: <R extends boolean>(required: R) =>
		recordDropdown({ displayName: 'Stage', description: 'A stage of the selected pipeline.', required, refreshers: ['pipelineId'], load: loadStages }),
	userId: <R extends boolean>({ displayName, required, description = 'An ActiveCampaign user.' }: { displayName: string; required: R; description?: string }) =>
		recordDropdown({ displayName, description, required, load: loadUsers }),
	dealId: recordDropdown({ displayName: 'Deal', description: 'Type to search deals by title, contact or organization.', required: true, load: loadDeals }),
	taskTypeId: recordDropdown({ displayName: 'Task Type', description: 'For example Call or Email.', required: true, load: loadTaskTypes }),
	automationId: recordDropdown({ displayName: 'Automation', description: 'Type to search automations by name.', required: true, load: loadAutomations }),
	accountCustomFields: Property.DynamicProperties({
		auth: activeCampaignAuth,
		displayName: 'Account Custom Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};
			const client = makeClient(auth.props);
			const res = await client.listAccountCustomFields();
			const fields: InputPropertyMap = {};
			for (const field of res.items) {
				const id = acData.textAt({ value: field, key: 'id' });
				const prop = customFieldProp({
					type: acData.textAt({ value: field, key: 'fieldType' }),
					displayName: acData.textAt({ value: field, key: 'fieldLabel' }) ?? `Field ${id}`,
					options: stringOptions(field['fieldOptions']),
				});
				if (id !== undefined && prop !== undefined) {
					fields[id] = prop;
				}
			}
			return fields;
		},
	}),
	contactCustomFields: Property.DynamicProperties({
		auth: activeCampaignAuth,
		displayName: 'Contact Custom Fields',
		refreshers: [],
		required: true,
		props: async ({ auth }) => {
			if (!auth) return {};
			const client = makeClient(auth.props);
			const res = await client.listContactCustomFields();
			const fields: InputPropertyMap = {};
			for (const field of res.fields) {
				const prop = customFieldProp({
					type: field.type,
					displayName: field.title,
					options: res.fieldOptions.filter((item) => item.field === field.id).map((item) => ({ label: item.label, value: item.value })),
				});
				if (prop !== undefined) {
					fields[field.id] = prop;
				}
			}
			return fields;
		},
	}),
};

type LoadParams = {
	client: ActiveCampaignClient;
	search: string | undefined;
	propsValue: Record<string, unknown>;
};

type LoadResult = {
	options: DropdownOption<string>[];
	total?: number;
	placeholder?: string;
};

type RecordDropdownParams<R extends boolean> = {
	displayName: string;
	description: string;
	required: R;
	refreshers?: string[];
	load: (params: LoadParams) => Promise<LoadResult>;
};
