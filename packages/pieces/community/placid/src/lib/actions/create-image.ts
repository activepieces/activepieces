import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import {
	imageTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { PlacidCreateImageRequest } from '../common';

export const createImage = createAction({
	auth: placidAuth,
	name: 'create_image',
	classification: 'WRITE',
	displayName: 'Create Image',
	description: 'Generates a dynamic image from a specified template using input data.',
	audience: 'human',
	aiMetadata: { description: 'Render a dynamic image from a Placid template by filling its layers with provided data; choose this to produce a rendered image asset from a template. Requires a template UUID. By default the render is queued and returns immediately; enabling create_now waits up to 5 minutes for the image to finish and returns it still queued after that; a failed render returns the Placid error message. Not idempotent — each call queues a new render job.', idempotent: false },
	outputSchema: placidSchemas.image,
	props: {
		template: imageTemplateDropdown,
		layers: templateLayersProperty('image'),
		outputDpi: Property.StaticDropdown({
			displayName: 'Output DPI',
			description: 'Resolution of the output; leave empty for the template default.',
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
			description: 'File name without extension, e.g. invoice-123.',
			placeholder: 'invoice-123',
			required: false,
		}),
		webhook_success: webhookProperty,
		create_now: createNowProperty('image'),
		passthrough: passthroughProperty,
	},
	async run(context) {
		const { template, webhook_success, create_now, passthrough, outputDpi, outputFilename } =
			context.propsValue;

		const modifiedLayers = placidHelpers.flattenDynamicLayers(context.propsValue.layers);

		const client = new PlacidClient(context.auth);

		const modifications = {
			...(outputFilename && { filename: outputFilename }),
			...(outputDpi && { dpi: outputDpi }),
		};

		const request: PlacidCreateImageRequest = {
			template_uuid: template,
			...(modifiedLayers ? { layers: modifiedLayers } : {}),
			...(webhook_success && { webhook_success }),
			...(create_now !== undefined && { create_now }),
			...(passthrough && { passthrough }),
			...(Object.keys(modifications).length && { modifications }),
		};

		return await client.createImage(request);
	},
});
