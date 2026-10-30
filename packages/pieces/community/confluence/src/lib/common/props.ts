import {
	DropdownOption,
	DropdownState,
	DynamicPropsValue,
	Property,
} from '@activepieces/pieces-framework';
import { parseStringPromise } from 'xml2js';

import { confluenceAuth } from '../auth';
import { confluenceApi } from './api';

import type { ConfluenceTemplateDeclarations } from './types';

function spaceId<R extends boolean>({ required, displayName = 'Space', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: confluenceAuth,
		displayName,
		description,
		refreshers: [],
		required,
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Please connect your account first.' });
			}
			const spaces = await confluenceApi.listSpaces({ auth });
			return {
				disabled: false,
				options: spaces.map((space) => ({ label: space.name, value: space.id })),
			};
		},
	});
}

function pageId<R extends boolean>({ required, displayName = 'Page', description }: PropParams<R>) {
	return Property.Dropdown({
		auth: confluenceAuth,
		displayName,
		description,
		refreshers: ['spaceId'],
		required,
		options: async ({ auth, spaceId }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Please connect your account first.' });
			}
			const pages = await confluenceApi.listPages({
				auth,
				spaceId: spaceId ? String(spaceId) : undefined,
			});
			return {
				disabled: false,
				options: pages.map((page) => ({ label: page.title, value: page.id })),
			};
		},
	});
}

function templateId<R extends boolean>({ required, displayName = 'Template', description }: PropParams<R>) {
	return Property.Dropdown({
		displayName,
		description,
		auth: confluenceAuth,
		refreshers: ['spaceId'],
		required,
		options: async ({ auth, spaceId }) => {
			if (!auth || !spaceId) {
				return disabledOptions({
					placeholder: 'Please connect your account first and select a space.',
				});
			}

			const space = await confluenceApi.getSpace({ auth, spaceId: String(spaceId) });

			const templates = await confluenceApi.listPageTemplates({ auth, spaceKey: space.key });

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
}

function folderId<R extends boolean>({ required, displayName = 'Parent Folder', description }: PropParams<R>) {
	return Property.Dropdown({
		displayName,
		description,
		auth: confluenceAuth,
		refreshers: ['spaceId'],
		required,
		options: async ({ auth, spaceId }) => {
			if (!auth || !spaceId) {
				return disabledOptions({
					placeholder: 'Please connect your account first and select a space.',
				});
			}

			const space = await confluenceApi.getSpace({ auth, spaceId: String(spaceId) });

			const folders = await confluenceApi.listFolderDescendants({
				auth,
				contentId: space.homepageId,
			});

			const options: DropdownOption<string>[] = [];
			for (const folder of folders) {
				options.push({
					label: folder.title,
					value: folder.id,
				});
			}
			return {
				disabled: false,
				options,
			};
		},
	});
}

function templateVariables<R extends boolean>({
	required,
	displayName = 'Template Variables',
	description,
}: PropParams<R>) {
	return Property.DynamicProperties({
		displayName,
		description,
		auth: confluenceAuth,
		refreshers: ['templateId'],
		required,
		props: async ({ auth, templateId }) => {
			if (!auth) return {};
			if (!templateId) return {};

			const props: DynamicPropsValue = {};

			const response = await confluenceApi.getTemplate({ auth, templateId: String(templateId) });

			const parsedXml = await parseStringPromise(response.body.storage.value, {
				explicitArray: false,
			});
			const declarations: ConfluenceTemplateDeclarations | undefined = parsedXml['at:declarations'];

			if (!declarations) return {};

			const variables: Array<{ name: string; type: string; options?: string[] }> = [];

			Object.entries(declarations).forEach(([key, value]) => {
				const type = key.replace('at:', '');
				if (Array.isArray(value)) {
					value.forEach((item) => {
						if (item['$']) {
							const varName = item['$']['at:name'];
							let options: string[] | undefined;

							if (type === 'list' && item['at:option']) {
								options = item['at:option'].map((opt) => opt['$']['at:value']);
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
						options = value['at:option'].map((opt) => opt['$']['at:value']);
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
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const confluenceProps = { spaceId, pageId, templateId, folderId, templateVariables };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
