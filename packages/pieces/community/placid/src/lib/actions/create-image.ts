import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
	imageTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { isNil } from '@activepieces/shared';
import { PlacidCreateImageRequest } from '../common';

export const createImage = createAction({
	auth: placidAuth,
	name: 'create_image',
	displayName: 'Create Image',
	description: 'Generates a dynamic image from a specified template using input data.',
	props: {
		template: imageTemplateDropdown,
		layers: templateLayersProperty('image'),
		outputDpi: Property.StaticDropdown({
			displayName: 'Output DPI',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '72 DPI', value: 72 },
					{ label: '150 DPI', value: 150 },
					{ label: '300 DPI', value: 300 },
				],
			},
		}),
		outputFilename: Property.ShortText({
			displayName: 'Output File Name',
			required: false,
		}),
		webhook_success: webhookProperty,
		create_now: createNowProperty,
		passthrough: passthroughProperty,
	},
	async run(context) {
		const { template, webhook_success, create_now, passthrough, outputDpi, outputFilename } =
			context.propsValue;

		const layers = context.propsValue.layers ?? {};

		const modifiedLayers: Record<string, any> = {};

		for (const [key, value] of Object.entries(layers)) {
			if (value === '' || isNil(value)) continue;

			const [mainKey, subKey] = key.split(':::');
			if (!mainKey || !subKey) continue;

			if (!modifiedLayers[mainKey]) {
				modifiedLayers[mainKey] = {};
			}

			modifiedLayers[mainKey][subKey] = value;
		}

		const client = new PlacidClient(context.auth);

		const modifications = {
			...(outputFilename && { filename: outputFilename }),
			...(outputDpi && { dpi: outputDpi }),
		};

		const request: PlacidCreateImageRequest = {
			template_uuid: template,
			...(modifiedLayers && { layers: modifiedLayers }),
			...(webhook_success && { webhook_success }),
			...(create_now !== undefined && { create_now }),
			...(passthrough && { passthrough }),
			...(Object.keys(modifications).length && { modifications }),
		};

		return await client.createImage(request);
	},
});
