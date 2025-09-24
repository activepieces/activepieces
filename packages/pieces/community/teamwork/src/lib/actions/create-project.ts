import {
	createAction,
	Property,
	OAuth2PropertyValue,
	DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

export const createProject = createAction({
	name: 'create_project',
	displayName: 'Create Project',
	description: 'Create a new project (name, description, belongs to company, dates, etc.).',
	auth: teamworkAuth,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the project.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'A description for the project.',
			required: false,
		}),
		companyId: Property.Dropdown({
			displayName: 'Company',
			description: 'The company to associate the project with.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/companies.json',
				});
				const options = res.data.companies.map((c: { id: string; name: string }) => ({
					label: c.name,
					value: c.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		'category-id': Property.Dropdown({
			displayName: 'Category',
			description: 'The category to assign the project to.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/projectcategories.json',
				});
				const options = res.data.projectCategories.map((c: { id: string; name: string }) => ({
					label: c.name,
					value: c.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		tagIds: Property.MultiSelectDropdown({
			displayName: 'Tags',
			description: 'Tags to associate with the project.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/tags.json',
				});
				const options = res.data.tags.map((t: { id: string; name: string }) => ({
					label: t.name,
					value: t.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		'start-date': Property.DateTime({
			displayName: 'Start Date',
			description: 'The start date of the project.',
			required: false,
		}),
		'end-date': Property.DateTime({
			displayName: 'End Date',
			description: 'The end date of the project.',
			required: false,
		}),
		projectOwnerId: Property.Dropdown({
			displayName: 'Project Owner',
			description: 'The user to assign as the project owner.',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/people.json',
				});
				const options = res.data.people.map((p: { id: string; 'first-name': string; 'last-name': string }) => ({
					label: `${p['first-name']} ${p['last-name']}`,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		customFields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			description: 'Custom fields for this project.',
			required: false,
			refreshers: [],
			props: async ({ auth }) => {
				if (!auth) return {};

				const fields: DynamicPropsValue = {};
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/customfields.json',
					query: {
						entities: 'projects',
					},
				});

				if (res.data?.customfields) {
					for (const field of res.data.customfields) {
						fields[field.id] = Property.ShortText({
							displayName: field.name,
							required: field.required,
						});
					}
				}
				return fields;
			},
		}),
	},
	async run({ auth, propsValue }) {
		const formatDate = (date: string | undefined) => {
			if (!date) return undefined;
			return new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
		};

		const customFields = Object.entries(propsValue.customFields ?? {}).map(
			([customFieldId, value]) => ({ customFieldId: parseInt(customFieldId), value })
		);

		const body = {
			project: {
				name: propsValue.name,
				description: propsValue.description,
				companyId: propsValue.companyId,
				'category-id': propsValue['category-id'],
				tagIds: propsValue.tagIds?.join(','),
				'start-date': formatDate(propsValue['start-date']),
				'end-date': formatDate(propsValue['end-date']),
				projectOwnerId: propsValue.projectOwnerId,
				customFields: customFields.length > 0 ? customFields : undefined,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects.json`,
			body,
		});
	},
});


