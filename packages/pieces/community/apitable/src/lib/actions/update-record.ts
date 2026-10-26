import {
	DynamicPropsValue,
	MarkdownVariant,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { updateRecordActionOutputSchema } from '../output-schemas';

export const updateRecordAction = createAction({
	auth: APITableAuth,
	name: 'apitable_update_record',
	classification: 'WRITE',
	displayName: 'Update Record',
	description: 'Updates an existing record in a datasheet.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates the field values of an existing record in an AITable datasheet, identified by its record ID. Use when an agent needs to modify a row it can already locate. Idempotent: re-applying the same field values to the same record ID yields the same result with no extra side effect.',
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'record',
			display: 'section',
			label: 'Record to Update',
			icon: 'file',
			props: ['space_id', 'datasheet_id', 'recordId'],
		},
		{
			key: 'changes',
			display: 'section',
			label: 'Changes',
			icon: 'text',
			props: ['info', 'fields'],
		},
	],
	props: {
		space_id: APITableCommon.space_id,
		datasheet_id: APITableCommon.datasheet_id,
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'Map it from a trigger or a Find Records step.',
			placeholder: 'rec2T5ppW1Mal',
			required: true,
		}),
		info: Property.MarkDown({
			value:
				'Blank fields keep their current value; unticked checkboxes are cleared. Some column types, such as attachments and formulas, are not listed.',
			variant: MarkdownVariant.INFO,
		}),
		fields: APITableCommon.fields({
			description:
				'Blank fields keep their value; unticked checkboxes are cleared.',
		}),
	},
	outputSchema: updateRecordActionOutputSchema,
	async run(context) {
		const auth = context.auth;
		const datasheetId = context.propsValue.datasheet_id;
		const recordId = context.propsValue.recordId;
		const dynamicFields: DynamicPropsValue = context.propsValue.fields;
		const fields: {
			[n: string]: string;
		} = {};

		const props = Object.entries(dynamicFields);
		for (const [propertyKey, propertyValue] of props) {
			if (propertyValue !== undefined && propertyValue !== '') {
				fields[propertyKey] = propertyValue;
			}
		}
		
		const newFields: Record<string, unknown> = await createNewFields(
			auth.props,
			datasheetId,
			fields,
		);

		const client = makeClient(context.auth.props);

		const response: any = await client.updateRecord(datasheetId, {
			records: [
				{
					recordId: recordId,
					fields: {
						...newFields,
					},
				},
			],
		});

		if (!response.success) {
			throw new Error(JSON.stringify(response, undefined, 2));
		}

		return response;
	},
});
