import { DynamicPropsValue, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { BikaAuth } from '../..';
import { BikaClient } from './client';
import { BikaFieldType, BikaNumericFieldTypes } from './constants';

export function makeClient(auth: PiecePropValueSchema<typeof BikaAuth>) {
	const client = new BikaClient(auth.token);
	return client;
}

export const BikaCommon = {
	space_id: Property.Dropdown({
		displayName: 'Space',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your account first.',
				};
			}
			const client = makeClient(auth as PiecePropValueSchema<typeof BikaAuth>);
			const res = await client.listSpaces();
			return {
				disabled: false,
				options: res.data.map((space) => {
					return {
						label: space.name,
						value: space.id,
					};
				}),
			};
		},
	}),
	database_id: Property.Dropdown({
		displayName: 'Database',
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
			const client = makeClient(auth as PiecePropValueSchema<typeof BikaAuth>);
			const res = await client.listDatabases(space_id as string);

			return {
				disabled: false,
				options: res.data.map((database) => {
					return {
						label: database.name,
						value: database.id,
					};
				}),
			};
		},
	}),
	fields: Property.DynamicProperties({
		displayName: 'Fields',
		description: 'The fields to add to the record.',
		required: true,
		refreshers: ['auth', 'space_id', 'database_id'],
		props: async ({ auth, space_id, database_id }) => {
			if(!auth || !space_id || !database_id) return {};
			
			const client = makeClient(auth as PiecePropValueSchema<typeof BikaAuth>);
			const res = await client.getDatabaseFields(space_id as unknown as  string, database_id as unknown as string);

			const props: DynamicPropsValue = {};

			for (const field of res.data) {
				if (
					![
						BikaFieldType.AUTONUMBER,
						BikaFieldType.CASCADER,
						BikaFieldType.CREATED_BY,
						BikaFieldType.CREATED_TIME,
						BikaFieldType.FORMULA,
						BikaFieldType.LAST_MODIFIED_BY,
						BikaFieldType.LAST_MODIFIED_TIME,
						BikaFieldType.LOOKUP,
					].includes(field.type)
				) {
					switch (field.type) {
						case BikaFieldType.ATTACHMENT:
							props[field.name] = Property.File({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.CHECKBOX:
							props[field.name] = Property.Checkbox({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.CURRENCY:
						case BikaFieldType.NUMBER:
						case BikaFieldType.PERCENT:
						case BikaFieldType.RATING:
							props[field.name] = Property.Number({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.DATETIME:
							props[field.name] = Property.DateTime({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.EMAIL:
						case BikaFieldType.PHONE:
						case BikaFieldType.SINGLE_TEXT:
						case BikaFieldType.URL:
							props[field.name] = Property.ShortText({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.LONG_TEXT:
							props[field.name] = Property.LongText({
								displayName: field.name,
								required: false,
							});
							break;
						case BikaFieldType.MULTI_SELECT:
							props[field.name] = Property.StaticMultiSelectDropdown({
								displayName: field.name,
								required: false,
								options: {
									options: field.property?.options?.map((option) => ({
										label: option.name,
										value: option.name,
									})) || [],
								},
							});
							break;
						case BikaFieldType.SINGLE_SELECT:
							props[field.name] = Property.StaticDropdown({
								displayName: field.name,
								required: false,
								options: {
									options: field.property?.options?.map((option) => ({
										label: option.name,
										value: option.name,
									})) || [],
								},
							});
							break;
						case BikaFieldType.MEMBER:
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
					case BikaFieldType.LINK:
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
	auth: PiecePropValueSchema<typeof BikaAuth>,
	space_id: string,
	database_id: string,
	fields: Record<string, unknown>,
) {
	if (!auth) return fields;
	if (!database_id) return fields;

	const newFields: Record<string, unknown> = {};

	const client = makeClient(auth as PiecePropValueSchema<typeof BikaAuth>);
	const res = await client.getDatabaseFields(space_id,database_id);

	for(const field of res.data) {
		if (
			[
			  BikaFieldType.AUTONUMBER,
			  BikaFieldType.CASCADER,
			  BikaFieldType.CREATED_BY,
			  BikaFieldType.CREATED_TIME,
			  BikaFieldType.FORMULA,
			  BikaFieldType.LAST_MODIFIED_TIME,
			  BikaFieldType.LAST_MODIFIED_BY,
			  BikaFieldType.LOOKUP,
			].includes(field.type) || !(field.name in fields)
		  ) {
			continue; // Skip irrelevant or missing fields
		  }

		  const key = field.name;

		  // Handle numeric fields
		  if(BikaNumericFieldTypes.includes(field.type))
		  {
			newFields[key] = Number(fields[key]);
		  }
		  // Handle member fields
		  else if(field.type === BikaFieldType.MEMBER)
		  {
			newFields[key] = field.property?.options?.filter(
				(member) => member.id === `${fields[key]}`,
			);
		  }
		  // Handle multi-select and two-way-link fields
		  else if([BikaFieldType.MULTI_SELECT].includes(field.type))
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
