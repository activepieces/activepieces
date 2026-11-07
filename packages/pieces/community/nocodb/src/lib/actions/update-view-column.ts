import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbResultOutputSchema } from '../output-schemas';

export const updateViewColumnAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-update-view-column',
	outputSchema: nocodbResultOutputSchema,
	classification: 'WRITE',
	displayName: 'Update View Column',
	description: 'Shows, hides, or reorders a column within a view.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a column\'s visibility and/or order within a specific view, identified by the view-scoped column ID from List View Columns (not the table column ID). Use to curate what an agent or user sees in a view. Idempotent: re-applying the same show/order state yields the same result.',
		idempotent: true,
	},
	props: {
		viewId: Property.ShortText({
			displayName: 'View ID',
			required: true,
		}),
		columnId: Property.ShortText({
			displayName: 'View Column ID',
			description: 'The view-scoped column ID from List View Columns, not the table column ID.',
			required: true,
		}),
		show: Property.StaticDropdown<string, false>({
			displayName: 'Show',
			description: 'Whether the column is visible in the view. Leave empty or pick Leave unchanged to keep the current setting.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
					{ label: 'Leave unchanged', value: 'unchanged' },
				],
			},
		}),
		order: Property.Number({
			displayName: 'Order',
			required: false,
		}),
	},
	async run(context) {
		const { viewId, columnId, order } = context.propsValue;
		const show = showValue(context.propsValue.show);
		const client = makeClient(context.auth);
		return await client.updateViewColumn(viewId, columnId, { show, order });
	},
});

function showValue(value: unknown): boolean | undefined {
	const normalized = typeof value === 'string' ? value.trim().toLowerCase() : value;
	if (normalized === true || normalized === 'yes' || normalized === 'true') return true;
	if (normalized === false || normalized === 'no' || normalized === 'false') return false;
	return undefined;
}
