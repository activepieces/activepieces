import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomBytes } from 'crypto';
import { smartsuiteAuth } from '../auth';
import { smartSuiteApi } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { tableSummary } from '../common/tables';
import { outputSchemas } from '../output-schemas';

const FIELD_TYPES = [
	{ label: 'Text', value: 'textfield' },
	{ label: 'Text Area', value: 'textareafield' },
	{ label: 'Number', value: 'numberfield' },
	{ label: 'Currency', value: 'currencyfield' },
	{ label: 'Percent', value: 'percentfield' },
	{ label: 'Date', value: 'datefield' },
	{ label: 'Yes / No', value: 'yesnofield' },
	{ label: 'Email', value: 'emailfield' },
	{ label: 'Link', value: 'linkfield' },
	{ label: 'Single Select', value: 'singleselectfield' },
	{ label: 'Multiple Select', value: 'multipleselectfield' },
	{ label: 'Files & Images', value: 'filefield' },
];
const SELECT_TYPES = ['singleselectfield', 'multipleselectfield'];
const SLUG_PATTERN = /^[a-z][a-z0-9_]{0,29}$/;

async function addOne({
	credentials,
	tableId,
	label,
	fieldType,
	choices,
	slug,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	label: unknown;
	fieldType: unknown;
	choices: unknown[] | undefined;
	slug: string | undefined;
}) {
	const fieldLabel = smartSuiteInputs.requireText({ value: label, label: 'Field Label' });
	const type = smartSuiteInputs.requireText({ value: fieldType, label: 'Field Type' });
	if (!FIELD_TYPES.some((option) => option.value === type)) {
		throw new Error(`Field Type must be one of: ${FIELD_TYPES.map((option) => option.value).join(', ')}.`);
	}
	const requestedSlug = slug?.trim();
	if (requestedSlug && !SLUG_PATTERN.test(requestedSlug)) {
		throw new Error('Field Slug must start with a lowercase letter and use only lowercase letters, digits and _ (up to 30 characters).');
	}
	const choiceLabels = (choices ?? []).map((choice) => String(choice ?? '').trim()).filter((choice) => choice.length > 0);
	if (SELECT_TYPES.includes(type) && choiceLabels.length === 0) {
		throw new Error('Select fields need at least one choice.');
	}
	const finalSlug = requestedSlug && requestedSlug.length > 0 ? requestedSlug : `s${randomBytes(5).toString('hex').slice(0, 9)}`;
	const params: Record<string, unknown> = SELECT_TYPES.includes(type)
		? { choices: choiceLabels.map((choice, index) => ({ label: choice, value: `c${index + 1}${randomBytes(2).toString('hex')}` })) }
		: {};
	await smartSuiteClient.request<unknown>({
		credentials,
		method: HttpMethod.POST,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/add_field/`,
		body: {
			field: { slug: finalSlug, label: fieldLabel, field_type: type, params },
			field_position: {},
			auto_fill_structure_layout: true,
		},
		operation: 'add field',
	});
	const table = await smartSuiteApi.getTable({ credentials, tableId });
	const added = table.structure.find((field) => field.slug === finalSlug);
	if (!added) {
		throw new Error(`SmartSuite accepted the field but it is not in the table schema yet (slug ${finalSlug}). Check the table before retrying, to avoid a duplicate field.`);
	}
	return { tableId: table.id, field: tableSummary.describeField(added) };
}

function fieldProps() {
	return {
		label: Property.ShortText({
			displayName: 'Field Label',
			required: true,
		}),
		fieldType: Property.StaticDropdown({
			displayName: 'Field Type',
			required: true,
			options: { disabled: false, options: FIELD_TYPES },
		}),
		choices: Property.Array({
			displayName: 'Choices',
			description: 'Options for a single or multiple select field.',
			required: false,
		}),
		slug: Property.ShortText({
			displayName: 'Field Slug',
			description: 'Optional key for the field (lowercase letters, digits and _, starting with a letter, up to 30 characters). Generated when empty.',
			required: false,
		}),
	};
}

export const addField = createAction({
	name: 'add_field',
	classification: 'WRITE',
	displayName: 'Add Field',
	description: 'Adds a new field (column) to a table.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version with solution and table pickers; agents should use Add Field (by ID). Adds one field: text, text area, number, currency, percent, date, yes/no, email, link, single or multiple select (with choices) or files. Changes the table schema for everyone using it and needs permission to edit the solution. Returns the new field with its slug. Not idempotent: each call adds another field.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		...fieldProps(),
	},
	outputSchema: outputSchemas['addField'],
	async run({ auth, propsValue }) {
		return addOne({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, label: propsValue.label, fieldType: propsValue.fieldType, choices: propsValue.choices, slug: propsValue.slug });
	},
});

export const addFieldById = createAction({
	name: 'add_field_by_id',
	classification: 'WRITE',
	displayName: 'Add Field (by ID)',
	description: 'Adds a new field (column) to a table, by table ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Adds a field to a SmartSuite table (Table ID from List Tables (by ID)). Adds one field: text, text area, number, currency, percent, date, yes/no, email, link, single or multiple select (with choices) or files. Changes the table schema for everyone using it and needs permission to edit the solution. Returns the new field with its slug. Not idempotent: each call adds another field. Check Get Table Schema (by ID) first so you do not add a field that already exists; use the returned slug in record JSON.',
		idempotent: false,
	},
	auth: smartsuiteAuth,
	props: {
		tableId: smartSuiteInputs.aiProps.tableId(),
		...fieldProps(),
	},
	outputSchema: outputSchemas['addField'],
	async run({ auth, propsValue }) {
		return addOne({ credentials: smartSuiteClient.credentialsOf(auth), tableId: propsValue.tableId, label: propsValue.label, fieldType: propsValue.fieldType, choices: propsValue.choices, slug: propsValue.slug });
	},
});
