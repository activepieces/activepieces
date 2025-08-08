import { Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const teamidDropdown = Property.Dropdown({
	displayName: 'Team ID',
	description: 'Select the team containing the database.',
	required: true,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		try {
			const teams = await makeRequest<{ id: string; name: string }[]>(
				auth as string,
				HttpMethod.GET,
				'/teams',
			);
			return {
				disabled: false,
				options: teams.map((team) => ({
					label: team.name,
					value: team.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading teams',
			};
		}
	},
});

export const databaseIdDropdown = Property.Dropdown({
	displayName: 'Database ID',
	description: 'Select the database containing the table.',
	required: true,
	refreshers: ['teamid'],
	options: async ({ auth, teamid }) => {
		if (!auth || !teamid) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please select a team first.',
			};
		}

		try {
			const databases = await makeRequest<{ id: string; name: string }[]>(
				auth as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases`,
			);
			return {
				disabled: false,
				options: databases.map((db) => ({
					label: db.name,
					value: db.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading databases',
			};
		}
	},
});

export const tableIdDropdown = Property.Dropdown({
	displayName: 'Table ID',
	description: 'Select the table',
	required: true,
	refreshers: ['teamid', 'dbid'],
	options: async ({ auth, teamid, dbid }) => {
		if (!auth || !teamid || !dbid) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please select a database first.',
			};
		}

		try {
			const tables = await makeRequest<{ id: string; name: string }[]>(
				auth as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases/${dbid}/tables`,
			);

			return {
				disabled: false,
				options: tables.map((table) => ({
					label: table.name,
					value: table.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading tables',
			};
		}
	},
});

export const recordIdDropdown = Property.Dropdown({
	displayName: 'Record ID',
	required: true,
	refreshers: ['teamid', 'dbid', 'tid'],
	options: async ({ auth, teamid, dbid, tid }) => {
		if (!auth || !teamid || !dbid || !tid) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please select a table first',
			};
		}

		try {
			const records = await makeRequest<{ id: number }[]>(
				auth as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases/${dbid}/tables/${tid}/records`,
			);
			return {
				disabled: false,
				options: records.map((record) => ({
					label: `Record ${record.id}`,
					value: record.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading records',
			};
		}
	},
});

export const filenameDropdown = Property.Dropdown({
	displayName: 'File ID',
	required: true,
	refreshers: ['teamid', 'dbid', 'tid', 'rid'],
	options: async ({ auth, teamid, dbid, tid, rid }) => {
		if (!auth || !teamid || !dbid || !tid || !rid) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please select a table first',
			};
		}

		try {
			const records = await makeRequest<{ name: string }[]>(
				auth as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files`,
			);
			return {
				disabled: false,
				options: records.map((record) => ({
					label: record.name,
					value: record.name,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading records',
			};
		}
	},
});

export const tableFields = Property.DynamicProperties({
	displayName: 'Record Fields',
	required: true,
	refreshers: ['teamid', 'dbid', 'tid'],
	props: async ({ auth, teamid, dbid, tid }) => {
		if (!auth || !teamid || !dbid || !tid) {
			return {};
		}

		try {
			// 1. Get the table schema (all possible fields)
			const tableSchemaResponse = await makeRequest<{
				fields: { id: string; name: string; type: string; choices: { caption: string }[] }[];
			}>(
				auth as unknown as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases/${dbid}/tables/${tid}`,
			);
			const schemaFields = tableSchemaResponse.fields || [];

			const fields: Record<string, any> = {};

			// 2. For each field in the schema, create an empty property
			for (const field of schemaFields) {
				const fieldName = field.name;
				const fieldType = field.type;

				if (fieldName === 'id' || fieldName === '_id') continue;

				switch (fieldType) {
					case 'string':
					case 'html':
					case 'link':
					case 'location':
					case 'email':
					case 'phone':
					case 'color':
						fields[fieldName] = Property.ShortText({
							displayName: fieldName,
							required: false,
						});
						break;
					case 'time':
						fields[fieldName] = Property.ShortText({
							displayName: fieldName,
							required: false,
							description: 'HH:mm:ss format.',
						});
						break;
					case 'number':
						fields[fieldName] = Property.Number({
							displayName: fieldName,
							required: false,
						});
						break;
					case 'boolean':
						fields[fieldName] = Property.Checkbox({
							displayName: fieldName,
							required: false,
						});
						break;
					case 'choice':
						fields[fieldName] = Property.StaticDropdown({
							displayName: fieldName,
							required: false,
							options: {
								disabled: false,
								options: field.choices.map((choice) => ({
									label: choice.caption,
									value: choice.caption,
								})),
							},
						});
						break;
					case 'multi':
						fields[fieldName] = Property.StaticMultiSelectDropdown({
							displayName: fieldName,
							required: false,
							options: {
								disabled: false,
								options: field.choices.map((choice) => ({
									label: choice.caption,
									value: choice.caption,
								})),
							},
						});
						break;
					case 'date':
					case 'timestamp':
						fields[fieldName] = Property.DateTime({
							displayName: fieldName,
							required: false,
						});
						break;
					default:
						break;
				}
			}

			return fields;
		} catch (error) {
			return {};
		}
	},
});

export const tablefieldDropdown = Property.Dropdown({
	displayName: 'Table Field',
	required: true,
	refreshers: ['teamid', 'dbid', 'tid'],
	options: async ({ auth, teamid, dbid, tid }) => {
		if (!auth || !teamid || !dbid) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please select a database first',
			};
		}

		try {
			const tableSchemaResponse = await makeRequest<{
				fields: { id: string; name: string; type: string; choices: { caption: string }[] }[];
			}>(
				auth as unknown as string,
				HttpMethod.GET,
				`/teams/${teamid}/databases/${dbid}/tables/${tid}`,
			);
			const schemaFields = tableSchemaResponse.fields || [];

			return {
				disabled: false,
				options: schemaFields.map((field) => ({
					label: field.name,
					value: field.id,
				})),
			};
		} catch (error) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Error loading tables',
			};
		}
	},
});
