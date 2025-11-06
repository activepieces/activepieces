import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
	videoTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { isNil } from '@activepieces/shared';
import { PlacidCreateVideoRequest } from '../common';

export const createVideo = createAction({
	auth: placidAuth,
	name: 'create_video',
	displayName: 'Create Video',
	description: 'Produces a video based on a template.',
	props: {
		template: videoTemplateDropdown,
		layers: templateLayersProperty('video'),
		outputFps: Property.Number({
			displayName: 'Output FPS',
			required: false,
			defaultValue: 25,
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
		const { template, outputFps, outputFilename, webhook_success, create_now, passthrough } =
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
			...(outputFps && { fps: outputFps }),
		};

		// Videos require a clips array structure
		const request: PlacidCreateVideoRequest = {
			clips: [
				{
					template_uuid: template,
					...(modifiedLayers && { layers: modifiedLayers }),
				},
			],
			...(Object.keys(modifications).length && { modifications }),
			...(webhook_success && { webhook_success }),
			...(create_now !== undefined && { create_now }),
			...(passthrough && { passthrough }),
		};

		return await client.createVideo(request);
	},
});
