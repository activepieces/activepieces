import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceApiCall, confluencePaginatedApiCall } from '.';
import { confluenceAuth } from '../auth';
import {
	DropdownOption,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { parseStringPromise } from 'xml2js';

function buildSpaceDropdown(required: boolean) {
	return Property.Dropdown({
		auth: confluenceAuth,
		displayName: 'Space',
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}
			const spaces = await confluencePaginatedApiCall<{ id: string; name: string }>({
				domain: auth.props.confluenceDomain,
				username: auth.props.username,
				password: auth.props.password,
				version: 'v2',
				method: HttpMethod.GET,
				resourceUri: '/spaces',
			});
			return {
				disabled: false,
				options: spaces.map((space) => ({ label: space.name, value: space.id })),
			};
		},
	});
}

export const spaceIdProp = buildSpaceDropdown(true);
export const spaceIdPropOptional = buildSpaceDropdown(false);

function buildPageDropdown(displayName: string, required: boolean) {
	return Property.Dropdown({
		auth: confluenceAuth,
		displayName,
		refreshers: ['spaceId'],
		required,
		options: async ({ auth, spaceId }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Please connect your account first.',
				};
			}
			const resourceUri = spaceId ? `/spaces/${spaceId}/pages` : `/pages`;
			const pages = await confluencePaginatedApiCall<{ id: string; title: string }>({
				domain: auth.props.confluenceDomain,
				username: auth.props.username,
				password: auth.props.password,
				version: 'v2',
				method: HttpMethod.GET,
				resourceUri,
			});
			return {
				disabled: false,
				options: pages.map((page) => ({ label: page.title, value: page.id })),
			};
		},
	});
}

export const pageIdProp = buildPageDropdown('Page', true);
export const pageIdPropOptional = buildPageDropdown('Page', false);
export const parentPageIdProp = buildPageDropdown('Parent Page', false);

export const templateIdProp = Property.Dropdown({
	displayName: 'Template',
	auth: confluenceAuth,
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

		const space = await confluenceApiCall<{ id: string; name: string; key: string }>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/spaces/${spaceId}`,
		});

		const templates = await confluencePaginatedApiCall<{ templateId: string; name: string }>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
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
	auth: confluenceAuth,
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

		const space = await confluenceApiCall<{ id: string; name: string; key: string,homepageId:string }>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: `/spaces/${spaceId}`,
		});

		const folders = await confluencePaginatedApiCall<{id:string,title:string}>({
			domain:auth.props.confluenceDomain,
			username:auth.props.username,
			password:auth.props.password,
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
	auth: confluenceAuth,
	refreshers: ['templateId'],
	required: false,
	props: async ({ auth, templateId }) => {
		if (!auth) return {};
		if (!templateId) return {};

		const props: DynamicPropsValue = {};

		const response = await confluenceApiCall<{ body: { storage: { value: string } } }>({
			domain: auth.props.confluenceDomain,
			username: auth.props.username,
			password: auth.props.password,
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
