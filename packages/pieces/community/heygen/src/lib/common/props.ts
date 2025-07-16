import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { heygenApiCall } from './client';
import { isNil } from '@activepieces/shared';

export const folderDropdown = Property.Dropdown({
	displayName: 'Folder',
	description: 'Select the folder to store the video.',
	required: false,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const response = await heygenApiCall<{
			data: { folders: { id: string; name: string }[] };
		}>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/folders',
			apiVersion: 'v1',
		});

		return {
			disabled: false,
			options: response.data.folders.map((folder) => ({
				label: folder.name,
				value: folder.id,
			})),
		};
	},
});

export const brandVoiceDropdown = Property.Dropdown({
	displayName: 'Brand Voice',
	description: 'Select the Brand Voice to apply to the video.',
	required: false,
	refreshers: [],
	options: async ({ auth }) => {
		if (!auth) {
			return {
				disabled: true,
				options: [],
				placeholder: 'Please connect your account first.',
			};
		}

		const response = await heygenApiCall<{
			data: { list: { id: string; name: string }[] };
		}>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/brand_voice/list',
			apiVersion: 'v1',
		});

		return {
			disabled: false,
			options: response.data.list.map((voice) => ({
				label: voice.name,
				value: voice.id,
			})),
		};
	},
});

export const templateDropdown = Property.Dropdown({
	displayName: 'Template',
	description: 'Select the template to generate the video.',
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

		const response = await heygenApiCall<{
			data: { templates: { template_id: string; name: string; aspect_ratio: string }[] };
		}>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/templates',
			apiVersion: 'v2',
		});

		return {
			disabled: false,
			options: response.data.templates.map((template) => ({
				label: template.name,
				value: template.template_id,
			})),
		};
	},
});

export const supportedLanguagesDropdown = Property.Dropdown({
	displayName: 'Supported Language',
	description: 'Select the language for video translation.',
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

		const response = await heygenApiCall<{ data: { languages: string[] } }>({
			apiKey: auth as string,
			method: HttpMethod.GET,
			resourceUri: '/video_translate/target_languages',
			apiVersion: 'v2',
		});

		return {
			disabled: false,
			options: response.data.languages.map((lang) => ({
				label: lang,
				value: lang,
			})),
		};
	},
});

export const templateVariables = Property.DynamicProperties({
	displayName: 'Template Varriables',
	refreshers: ['templateId'],
	required: false,
	props: async ({ auth, templateId }) => {
		if (!auth || !templateId) return {};

		const fields: DynamicPropsValue = {};

		try {
			const response = await heygenApiCall<{
				data: { variables: { [x: string]: { type: string; name: string } } };
			}>({
				apiKey: auth as unknown as string,
				method: HttpMethod.GET,
				resourceUri: `/template/${templateId}`,
				apiVersion: 'v2',
			});

			const variables = response.data.variables;

			if (!isNil(variables)) return {};

			for (const [key, value] of Object.entries(response.data.variables)) {
				const fieldKey = key;
				const fieldType = value.type;

				switch (fieldType) {
					case 'text':
						fields[fieldKey] = Property.ShortText({
							displayName: fieldKey,
							required: false,
							description: 'Provide text value.',
						});
						break;
					case 'image':
						fields[fieldKey] = Property.ShortText({
							displayName: fieldKey,
							required: false,
							description: 'Provide image URL.',
						});
						break;
					case 'video':
						fields[fieldKey] = Property.ShortText({
							displayName: fieldKey,
							required: false,
							description: 'Provide video URL.',
						});
						break;
					case 'audio':
						fields[fieldKey] = Property.ShortText({
							displayName: fieldKey,
							required: false,
							description: 'Provide audio URL.',
						});
						break;
					case 'character': {
						const characters = await heygenApiCall<{
							avatars: { avatar_name: string; avatar_id: string }[];
							talking_photos: {
								talking_photo_id: string;
								talking_photo_name: string;
							}[];
						}>({
							apiKey: auth as unknown as string,
							method: HttpMethod.GET,
							resourceUri: `/avatars`,
							apiVersion: 'v2',
						});

						const options = [
							...characters.avatars.map((avatar) => ({
								label: avatar.avatar_name,
								value: avatar.avatar_id,
							})),
							...characters.talking_photos.map((photo) => ({
								label: photo.talking_photo_name,
								value: photo.talking_photo_id,
							})),
						];

						fields[fieldKey] = Property.StaticDropdown({
							displayName: fieldKey,
							required: false,
							description: 'Select one of avatar or talking photo.',
							options: { disabled: false, options },
						});
						break;
					}
					case 'voice': {
						const voices = await heygenApiCall<{
							voices: { name: string; voice_id: string }[];
						}>({
							apiKey: auth as unknown as string,
							method: HttpMethod.GET,
							resourceUri: `/voices`,
							apiVersion: 'v2',
						});

						fields[fieldKey] = Property.StaticDropdown({
							displayName: fieldKey,
							required: false,
							options: {
								disabled: false,
								options: voices.voices.map((voice) => ({
									label: voice.name,
									value: voice.voice_id,
								})),
							},
						});
						break;
					}
					default:
						break;
				}
			}

			return fields;
		} catch (error) {
			console.error(`${error instanceof Error ? error.message : 'Unknown error'}`);
			return {};
		}
	},
});
