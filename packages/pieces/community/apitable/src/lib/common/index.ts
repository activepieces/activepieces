import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { APITableAuth } from '../../';
import { AITableClient } from './client';
import { AITableFieldType, AITableNumericFieldTypes } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof APITableAuth>) {
	const client = new AITableClient(auth.apiTableUrl, auth.token);
	return client;
}

export const APITableCommon = {
	space_id: Property.Dropdown({
		displayName: 'Space',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your account first',
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof APITableAuth>);
			const res = await client.listSpaces();
			return {
				disabled: false,
				options: res.data.spaces.map((space) => {
					return {
						label: space.name,
						value: space.id,
					};
				}),
			};
		},
	}),
	datasheet_id: Property.Dropdown({
		displayName: 'Datasheet',
		required: true,
		refreshers: ['space_id'],
		options: async ({ auth, space_id }) => {
			if (!auth || !space_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your account first and select space.',
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof APITableAuth>);
			const res = await client.listDatasheets(space_id as string);
			return {
				disabled: false,
				options: res.data.nodes.map((datasheet) => {
					return {
						label: datasheet.name,
						value: datasheet.id,
					};
				}),
			};
		},
	}),
	fields: Property.DynamicProperties({
		displayName: 'Fields',
		description: 'The fields to add to the record.',
		required: true,
		refreshers: ['auth', 'datasheet_id'],
		props: async ({ auth, datasheet_id }) => {
			const client = makeClient(auth as PiecePropValueSchema<typeof APITableAuth>);
			const res = await client.getDatasheetFields(datasheet_id as unknown as string);

			const props: DynamicPropsValue = {};

			for (const field of res.data.fields) {
				if (
					![
						AITableFieldType.ATTACHMENT,
						AITableFieldType.AUTONUMBER,
						AITableFieldType.CASCADER,
						AITableFieldType.CREATED_BY,
						AITableFieldType.CREATED_TIME,
						AITableFieldType.FORMULA,
						AITableFieldType.LAST_MODIEFIED_TIME,
						AITableFieldType.LAST_MODIFIED_BY,
						AITableFieldType.MAGIC_LOOKUP,
						AITableFieldType.ONE_WAY_LINK,
					].includes(field.type)
				) {
					switch (field.type) {
						case AITableFieldType.CHECKBOX:
							props[field.name] = Property.Checkbox({
								displayName: field.name,
								required: false,
							});
							break;
						case AITableFieldType.CURRENCY:
						case AITableFieldType.NUMBER:
						case AITableFieldType.PERCENT:
						case AITableFieldType.RATING:
							props[field.name] = Property.Number({
								displayName: field.name,
								required: false,
							});
							break;
						case AITableFieldType.DATETIME:
							props[field.name] = Property.DateTime({
								displayName: field.name,
								required: false,
							});
							break;
						case AITableFieldType.EMAIL:
						case AITableFieldType.PHONE:
						case AITableFieldType.SINGLE_TEXT:
						case AITableFieldType.URL:
							props[field.name] = Property.ShortText({
								displayName: field.name,
								required: false,
							});
							break;
						case AITableFieldType.TEXT:
							props[field.name] = Property.LongText({
								displayName: field.name,
								required: false,
							});
							break;
						case AITableFieldType.MULTI_SELECT:
							props[field.name] = Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: false,
								options: {
									options:
										field.property?.options?.map((option) => {
											return {
												label: option.name,
												value: option.name,
											};
										}) || [],
								},
							});
							break;
						case AITableFieldType.SINGLE_SELECT:
							props[field.name] = Property.StaticDropdown({
								displayName: field.name,
								required: false,
								options: {
									options:
										field.property?.options?.map((option) => {
											return {
												label: option.name,
												value: option.name,
											};
										}) || [],
								},
							});
							break;
						case AITableFieldType.MEMBER:
							props[field.name] = Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: false,
								options: {
									options:
										field.property?.options?.map((option) => {
											return {
												label: option.name,
												value: option.id,
											};
										}) || [],
								},
							});
							break;
						case AITableFieldType.TWO_WAY_LINK:
							props[field.name] = Property.Array({
								displayName: field.name,
								required: false,
							});
							break;
					}
				}
			}
			return props;
		},
	}),
};

export async function createNewFields(
	auth: PiecePropValueSchema<typeof APITableAuth>,
	datasheet_id: string,
	fields: Record<string, unknown>,
) {
	if (!auth) return fields;
	if (!datasheet_id) return fields;

	const newFields: Record<string, unknown> = {};

	const client = makeClient(auth as PiecePropValueSchema<typeof APITableAuth>);
	const res = await client.getDatasheetFields(datasheet_id as string);

	for(const field of res.data.fields) {
		if (
			[
			  AITableFieldType.ATTACHMENT,
			  AITableFieldType.AUTONUMBER,
			  AITableFieldType.CASCADER,
			  AITableFieldType.CREATED_BY,
			  AITableFieldType.CREATED_TIME,
			  AITableFieldType.FORMULA,
			  AITableFieldType.LAST_MODIEFIED_TIME,
			  AITableFieldType.LAST_MODIFIED_BY,
			  AITableFieldType.MAGIC_LOOKUP,
			  AITableFieldType.ONE_WAY_LINK,
			].includes(field.type) || !(field.name in fields)
		  ) {
			continue; // Skip irrelevant or missing fields
		  }

		  const key = field.name;

		  // Handle numeric fields
		  if(AITableNumericFieldTypes.includes(field.type)) 
		  {
			newFields[key] = Number(fields[key]);
		  }
		  // Handle member fields
		  else if(field.type === AITableFieldType.MEMBER)
		  {
			newFields[key] = field.property?.options?.filter(
				(member) => member.id === `${fields[key]}`,
			);
		  }
		  // Handle multi-select and two-way-link fields
		  else if([AITableFieldType.MULTI_SELECT, AITableFieldType.TWO_WAY_LINK].includes(field.type))
		  {
			if(!Array.isArray(fields[key]) || (fields[key] as Array<unknown>).length === 0)
			{
				continue; // Skip empty fields
			}
			newFields[key] = fields[key];
		  }
		  // Handle all other fields
		  else 
		  {
			newFields[key] = fields[key];
		}


	}
	return newFields;
}
