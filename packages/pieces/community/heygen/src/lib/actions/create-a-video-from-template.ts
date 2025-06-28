import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { heygenAuth } from '../common/auth';
import { heygenApiCall } from '../common/client';
import {
	folderDropdown,
	brandVoiceDropdown,
	templateDropdown,
	templateVariables,
} from '../common/props';
import { isNil } from '@activepieces/shared';

export const createVideoFromTemplateAction = createAction({
	auth: heygenAuth,
	name: 'create-video-from-template',
	displayName: 'Create Video from Template',
	description: 'Create a video using a selected template.',
	props: {
		templateId: templateDropdown,
		title: Property.ShortText({
			displayName: 'Video Title',
			required: true,
			description: 'Title of the generated video.',
		}),
		caption: Property.Checkbox({
			displayName: 'Enable Captions',
			required: false,
			defaultValue: false,
		}),
		includeGif: Property.Checkbox({
			displayName: 'Include GIF Preview',
			required: false,
			defaultValue: false,
		}),
		enableSharing: Property.Checkbox({
			displayName: 'Enable Public Sharing',
			required: false,
			defaultValue: false,
		}),
		folderId: folderDropdown,
		brandVoiceId: brandVoiceDropdown,
		callbackUrl: Property.ShortText({
			displayName: 'Callback URL',
			required: false,
			description: 'Webhook URL to notify when video rendering is complete.',
		}),
		dimensionWidth: Property.Number({
			displayName: 'Video Width',
			required: false,
			defaultValue: 1280,
		}),
		dimensionHeight: Property.Number({
			displayName: 'Video Height',
			required: false,
			defaultValue: 720,
		}),
		variables: templateVariables,
	},
	async run({ propsValue, auth }) {
		const {
			templateId,
			title,
			caption,
			includeGif,
			enableSharing,
			folderId,
			brandVoiceId,
			callbackUrl,
			dimensionWidth,
			dimensionHeight,
		} = propsValue;

		const inputVariables = propsValue.variables ?? {};

		const template = await heygenApiCall<{
			data: {
				variables: { [x: string]: { type: string; name: string; properties: Record<string, any> } };
			};
		}>({
			apiKey: auth as unknown as string,
			method: HttpMethod.GET,
			resourceUri: `/template/${templateId}`,
			apiVersion: 'v2',
		});

		const templateVariables = template.data.variables;
		const formattedVariables: Record<string, any> = {};

		for (const [key, value] of Object.entries(inputVariables)) {
			if (isNil(value) || value === '') continue;

			const variable = templateVariables[key];
			if (!variable) continue;

			const { type, name, properties } = variable;

			const base = { name, type };

			switch (type) {
				case 'text':
					formattedVariables[key] = {
						...base,
						properties: { content: value },
					};
					break;
				case 'image':
				case 'video':
				case 'audio':
					formattedVariables[key] = {
						...base,
						properties: { ...properties, url: value },
					};
					break;
				case 'character':
					formattedVariables[key] = {
						...base,
						properties: { ...properties, character_id: value },
					};
					break;
				case 'voice':
					formattedVariables[key] = {
						...base,
						properties: { ...properties, voice_id: value },
					};
					break;
				default:
					break;
			}
		}

		const body: Record<string, any> = {
			template_id: templateId,
			title,
			caption: caption === true,
			include_gif: includeGif === true,
			enable_sharing: enableSharing === true,
		};

		if (folderId) body['folder_id'] = folderId;
		if (brandVoiceId) body['brand_voice_id'] = brandVoiceId;
		if (callbackUrl) body['callback_url'] = callbackUrl;

		if (dimensionWidth && dimensionHeight) {
			body['dimension'] = {
				width: dimensionWidth,
				height: dimensionHeight,
			};
		}

		if (Object.keys(formattedVariables || {}).length) {
			body['variables'] = formattedVariables;
		}

		const response = await heygenApiCall({
			apiKey: auth as string,
			method: HttpMethod.POST,
			resourceUri: `/template/${templateId}/generate`,
			body,
			apiVersion: 'v2',
		});

		return response;
	},
});
