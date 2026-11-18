import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import {
	pdfTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { PlacidCreatePdfRequest } from '../common';

export const createPdf = createAction({
	auth: placidAuth,
	name: 'create_pdf',
	classification: 'WRITE',
	displayName: 'Create PDF',
	description: 'Generates a PDF document from a specified template.',
	audience: 'human',
	aiMetadata: { description: 'Render a PDF document from a Placid template by filling its layers with provided data; choose this to produce a PDF asset from a template. Requires a template UUID. By default the render is queued and returns immediately; enabling create_now waits up to 5 minutes for the PDF to finish and returns it still queued after that; a failed render returns the Placid error message. Not idempotent — each call queues a new render job.', idempotent: false },
	outputSchema: placidSchemas.pdf,
	props: {
		template: pdfTemplateDropdown,
		layers: templateLayersProperty('pdf'),
		outputDpi: Property.StaticDropdown({
			displayName: 'Output DPI',
			description: 'Resolution of the output; leave empty for the template default.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '96 DPI', value: 96 },
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
		create_now: createNowProperty('PDF'),
		passthrough: passthroughProperty,
	},
	async run(context) {
		const { template, outputDpi, outputFilename, webhook_success, create_now, passthrough } =
			context.propsValue;

		const modifiedLayers = placidHelpers.flattenDynamicLayers(context.propsValue.layers);

		const client = new PlacidClient(context.auth);

		const modifications = {
			...(outputFilename && { filename: outputFilename }),
			...(outputDpi && { dpi: outputDpi }),
		};

		const request: PlacidCreatePdfRequest = {
			pages: [
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

		return await client.createPdf(request);
	},
});
