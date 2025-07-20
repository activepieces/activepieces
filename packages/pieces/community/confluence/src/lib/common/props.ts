import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceApiCall, confluencePaginatedApiCall } from '.';
import { confluenceAuth } from '../../index';
import {
	DropdownOption,
	DynamicPropsValue,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { parseStringPromise } from 'xml2js';

export const spaceIdProp = Property.Dropdown({
	displayName: 'Space',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const authValue = auth as PiecePropValueSchema<typeof confluenceAuth>;
		const spaces = await confluencePaginatedApiCall<{ id: string; name: string }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			version: 'v2',
			method: HttpMethod.GET,
			resourceUri: '/spaces',
		});

		const options: DropdownOption<string>[] = [];
		for (const space of spaces) {
			options.push({
				label: space.name,
				value: space.id,
			});
		}
		return {
			disabled: false,
			options,
		};
	},
});

export const templateIdProp = Property.Dropdown({
	displayName: 'Template',
	refreshers: ['spaceId'],
	required: true,
	options: async ({ auth, spaceId }) => {
		if (!auth || !spaceId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first and select a space.',
			};
		}

		const authValue = auth as PiecePropValueSchema<typeof confluenceAuth>;

		const space = await confluenceApiCall<{ id: string; name: string; key: string }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/spaces/${spaceId}`,
		});

		const templates = await confluencePaginatedApiCall<{ templateId: string; name: string }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			version: 'v1',
			method: HttpMethod.GET,
			resourceUri: `/template/page`,
			query: { spaceKey: space.key },
		});

		const options: DropdownOption<string>[] = [];
		for (const template of templates) {
			options.push({
				label: template.name,
				value: template.templateId,
			});
		}
		return {
			disabled: false,
			options,
		};
	},
});

export const folderIdProp = Property.Dropdown({
	displayName:'Parent Folder',
	refreshers:['spaceId'],
	required:false,
	options:async ({auth,spaceId})=>{
		if (!auth || !spaceId) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first and select a space.',
			};
		}

		const authValue = auth as PiecePropValueSchema<typeof confluenceAuth>;

		const space = await confluenceApiCall<{ id: string; name: string; key: string,homepageId:string }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/spaces/${spaceId}`,
		});

		const folders = await confluencePaginatedApiCall<{id:string,title:string}>({
			domain:authValue.confluenceDomain,
			username:authValue.username,
			password:authValue.password,
			version:'v1',
			method:HttpMethod.GET,
			resourceUri:`/content/${space.homepageId}/descendant/folder`,
		})

		const options:DropdownOption<string>[] = [];
		for(const folder of folders){
			options.push({
				label:folder.title,
				value:folder.id
			})
		}
		return{
			disabled:false,
			options
		}
	}	
})

export const templateVariablesProp = Property.DynamicProperties({
	displayName: 'Template Variables',
	refreshers: ['templateId'],
	required: true,
	props: async ({ auth, templateId }) => {
		if (!auth) return {};
		if (!templateId) return {};

		const authValue = auth as PiecePropValueSchema<typeof confluenceAuth>;

		const props: DynamicPropsValue = {};

		const response = await confluenceApiCall<{ body: { storage: { value: string } } }>({
			domain: authValue.confluenceDomain,
			username: authValue.username,
			password: authValue.password,
			method: HttpMethod.GET,
			version: 'v1',
			resourceUri: `/template/${templateId}`,
		});

		const parsedXml = await parseStringPromise(response.body.storage.value, {
			explicitArray: false,
		});
		const declarations = parsedXml['at:declarations'];

		if (!declarations) return {};

		const variables: Array<{ name: string; type: string; options?: string[] }> = [];

		Object.entries(declarations).forEach(([key, value]: [string, any]) => {
			const type = key.replace('at:', '');
			if (Array.isArray(value)) {
				value.forEach((item) => {
					if (item['$']) {
						const varName = item['$']['at:name'];
						let options: string[] | undefined;

						if (type === 'list' && item['at:option']) {
							options = item['at:option'].map((opt: any) => opt['$']['at:value']);
						}

						if (varName && type) {
							variables.push({
								name: varName,
								type: type,
								options: options,
							});
						}
					}
				});
			} else if (value['$']) {
				const varName = value['$']['at:name'];
				let options: string[] | undefined;

				if (type === 'list' && value['at:option']) {
					options = value['at:option'].map((opt: any) => opt['$']['at:value']);
				}

				if (varName && type) {
					variables.push({
						name: varName,
						type: type,
						options: options,
					});
				}
			}
		});

		for (const variable of variables) {
			switch (variable.type) {
				case 'list':
					props[variable.name] = Property.StaticDropdown({
						displayName: variable.name,
						required: false,
						defaultValue: '',
						options: {
							disabled: false,
							options: variable.options
								? variable.options.map((option) => {
										return {
											label: option,
											value: option,
										};
								  })
								: [],
						},
					});
					break;
				case 'string':
					props[variable.name] = Property.ShortText({
						displayName: variable.name,
						required: false,
						defaultValue: '',
					});
					break;
				case 'textarea':
					props[variable.name] = Property.LongText({
						displayName: variable.name,
						required: false,
						defaultValue: '',
					});
					break;
				default:
					break;
			}
		}

		return props;
	},
});
