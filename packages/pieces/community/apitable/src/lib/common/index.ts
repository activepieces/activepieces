import { DynamicPropsValue, PiecePropValueSchema, Property, tryCatch } from '@activepieces/pieces-framework';
import { APITableAuth } from '../auth';
import { AITableClient } from './client';
import { AITableFieldType, AITableNumericFieldTypes } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof APITableAuth>) {
	const client = new AITableClient(auth.apiTableUrl, auth.token);
	return client;
}

export const APITableCommon = {
	space_id: Property.Dropdown({
		auth: APITableAuth,
		displayName: 'Space',
		description: 'The AITable workspace that holds your datasheet.',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your AITable account first',
				};
			}
			const client = makeClient(auth.props);
			const { data: res, error } = await tryCatch(() => client.listSpaces());
			if (error) {
				return {
					disabled: true,
					options: [],
					placeholder: "Couldn't load spaces. Check your connection.",
				};
			}
			if (res.data.spaces.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No spaces found for this account.',
				};
			}
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
		auth: APITableAuth,
		displayName: 'Datasheet',
		description: 'The table inside the space.',
		required: true,
		refreshers: ['space_id'],
		options: async ({ auth, space_id }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your AITable account first',
				};
			}
			if (!space_id) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select a space first',
				};
			}
			const client = makeClient(auth.props);
			const { data: res, error } = await tryCatch(() => client.listDatasheets(space_id as string));
			if (error) {
				return {
					disabled: true,
					options: [],
					placeholder: "Couldn't load datasheets. Check your connection.",
				};
			}
			if (res.data.nodes.length === 0) {
				return {
					disabled: false,
					options: [],
					placeholder: 'No datasheets in this space.',
				};
			}
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
	fields: ({ description }: { description: string }) => Property.DynamicProperties({
		auth: APITableAuth,
		displayName: 'Fields',
		description,
		required: true,
		refreshers: ['auth', 'datasheet_id'],
		props: async ({ auth, datasheet_id }) => {
			if(!auth || !datasheet_id)
			{
				return {}
			}
			const client = makeClient(auth.props);
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
								description: 'IDs of the records to link, like rec2T5ppW1Mal.',
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
			const value = fields[key];
			const selected = Array.isArray(value) ? value.map(String) : [String(value)];
			newFields[key] = field.property?.options?.filter(
				(member) => selected.includes(member.id),
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
