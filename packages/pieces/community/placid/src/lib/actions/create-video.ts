import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import {
	videoTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { PlacidCreateVideoRequest } from '../common';

export const createVideo = createAction({
	auth: placidAuth,
	name: 'create_video',
	classification: 'WRITE',
	displayName: 'Create Video',
	description: 'Produces a video based on a template.',
	audience: 'human',
	aiMetadata: { description: 'Render a video from a Placid template by filling its layers with provided data; choose this to produce a rendered video asset from a template. Requires a template UUID. By default the render is queued and returns immediately; enabling create_now waits up to 5 minutes for the video to finish and returns it still queued after that; a failed render returns the Placid error message. Not idempotent — each call queues a new render job.', idempotent: false },
	outputSchema: placidSchemas.video,
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
			description: 'File name without extension, e.g. invoice-123.',
			placeholder: 'invoice-123',
			required: false,
		}),
		webhook_success: webhookProperty,
		create_now: createNowProperty('video'),
		passthrough: passthroughProperty,
	},
	async run(context) {
		const { template, outputFps, outputFilename, webhook_success, create_now, passthrough } =
			context.propsValue;

		const modifiedLayers = placidHelpers.flattenDynamicLayers(context.propsValue.layers);

		const client = new PlacidClient(context.auth);

		const modifications = {
			...(outputFilename && { filename: outputFilename }),
			...(outputFps && { fps: outputFps }),
		};

		const request: PlacidCreateVideoRequest = {
			clips: [
				{
					template_uuid: template,
					...(modifiedLayers ? { layers: modifiedLayers } : {}),
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
