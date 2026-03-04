import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableClient } from './client';
import { TeableComputedFieldTypes, TeableFieldType, TeableNumericFieldTypes } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof TeableAuth>) {
	const client = new TeableClient(
		auth.token,
		auth.baseUrl || 'https://app.teable.ai'
	);
	return client;
}

export const TeableCommon = {
	base_id: Property.Dropdown({
    auth: TeableAuth,
		displayName: 'Base',
		description: 'The Teable base (equivalent to a database).',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Connect your account first.' };
			}
			const client = makeClient((auth as any).props ?? auth);
			const bases = await client.listBases();
			return {
				disabled: false,
				options: bases.map((b) => ({ label: b.name, value: b.id })),
			};
		},
	}),
	table_id: Property.Dropdown({
    auth: TeableAuth,
		displayName: 'Table',
		description: 'The table inside the selected base.',
		required: true,
		refreshers: ['base_id'],
		options: async ({ auth, base_id }) => {
			if (!auth || !base_id) {
				return { disabled: true, options: [], placeholder: 'Select a base first.' };
			}
			const client = makeClient((auth as any).props ?? auth);
			const tables = await client.listTables(base_id as string);
			return {
				disabled: false,
				options: tables.map((t) => ({ label: t.name, value: t.id })),
			};
		},
	}),
	fields: Property.DynamicProperties({
		auth: TeableAuth,
		displayName: 'Fields',
		description: 'The fields to add to the record.',
		required: true,
		refreshers: ['auth', 'table_id'],
		props: async ({ auth, table_id }) => {
			if (!auth || !table_id) return {};

			const client = makeClient((auth as any).props ?? auth);
			const fields = await client.listFields(table_id as string);

			const props: DynamicPropsValue = {};

			for (const field of fields) {
				// Skip computed / read-only fields
				if (field.isComputed || TeableComputedFieldTypes.includes(field.type)) {
					continue;
				}

				const choices = field.options?.choices ?? [];

				switch (field.type as TeableFieldType) {
					case TeableFieldType.CHECKBOX:
						props[field.name] = Property.Checkbox({ displayName: field.name, required: false });
						break;
					case TeableFieldType.NUMBER:
					case TeableFieldType.RATING:
						props[field.name] = Property.Number({ displayName: field.name, required: false });
						break;
					case TeableFieldType.DATE:
						props[field.name] = Property.DateTime({ displayName: field.name, required: false });
						break;
					case TeableFieldType.LONG_TEXT:
						props[field.name] = Property.LongText({ displayName: field.name, required: false });
						break;
					case TeableFieldType.MULTIPLE_SELECT:
						props[field.name] = Property.StaticMultiSelectDropdown({
							displayName: field.name,
							required: false,
							options: { options: choices.map((c) => ({ label: c.name, value: c.name })) },
						});
						break;
					case TeableFieldType.SINGLE_SELECT:
						props[field.name] = Property.StaticDropdown({
							displayName: field.name,
							required: false,
							options: { options: choices.map((c) => ({ label: c.name, value: c.name })) },
						});
						break;
					case TeableFieldType.LINK:
						props[field.name] = Property.Array({ displayName: field.name, required: false });
						break;
					case TeableFieldType.USER:
						props[field.name] = Property.Array({ displayName: field.name, required: false });
						break;
					case TeableFieldType.SINGLE_LINE_TEXT:
					default:
						props[field.name] = Property.ShortText({ displayName: field.name, required: false });
						break;
				}
			}
			return props;
		},
	}),
};

// Re-export for convenience
export { TeableFieldType, TeableNumericFieldTypes, TeableComputedFieldTypes };

