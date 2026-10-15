import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { listTicketTypes } from '../common/props';
import { listTicketTypesOutputSchema } from '../output-schemas';

export const listTicketTypesAction = createAction({
	auth: intercomAuth,
	name: 'list_ticket_types',
	classification: 'SEARCH',
	displayName: 'List Ticket Types',
	description: 'Lists ticket types with their attributes and list options.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the ticket types in the workspace with each attribute (name, data type, required to create) and list option IDs. Call before Create Ticket (by Type ID), Update Ticket (by ID) or Convert Conversation to Ticket. Read-only.',
		idempotent: true,
	},
	props: {
		includeArchived: Property.Checkbox({
			displayName: 'Include Archived',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: listTicketTypesOutputSchema,
	async run(context) {
		const types = await listTicketTypes({ auth: context.auth });
		const includeArchived = context.propsValue.includeArchived === true;
		return {
			items: types
				.filter((type) => includeArchived || type.archived !== true)
				.map((type) => ({
					id: type.id,
					name: type.name,
					description: type.description ?? null,
					category: type.category ?? null,
					archived: type.archived === true,
					attributes: (type.ticket_type_attributes?.data ?? [])
						.filter(isRecord)
						.filter((attribute) => includeArchived || attribute['archived'] !== true)
						.map((attribute) => ({
							name: attribute['name'],
							data_type: attribute['data_type'],
							required_to_create: attribute['required_to_create'] === true,
							visible_to_contacts: attribute['visible_to_contacts'] === true,
							options: listOptions(attribute['input_options']),
						})),
				})),
		};
	},
});

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function listOptions(inputOptions: unknown): Array<{ id: unknown; label: unknown }> {
	if (!isRecord(inputOptions) || !Array.isArray(inputOptions['list_options'])) {
		return [];
	}
	return inputOptions['list_options'].filter(isRecord).map((option) => ({ id: option['id'], label: option['label'] }));
}
