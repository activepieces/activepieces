import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../../index';
import { PlacidClient } from '../common/client';
import {
	pdfTemplateDropdown,
	webhookProperty,
	createNowProperty,
	passthroughProperty,
	templateLayersProperty,
} from '../common/props';
import { isNil } from '@activepieces/shared';
import { PlacidCreatePdfRequest } from '../common';

export const createPdf = createAction({
	auth: placidAuth,
	name: 'create_pdf',
	displayName: 'Create PDF',
	description: 'Generates a PDF document from a specified template.',
	props: {
		template: pdfTemplateDropdown,
		layers: templateLayersProperty('pdf'),
		outputDpi: Property.StaticDropdown({
			displayName: 'Output DPI',
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
			required: false,
		}),
		webhook_success: webhookProperty,
		create_now: createNowProperty,
		passthrough: passthroughProperty,
	},
	async run(context) {
		const { template, outputDpi, outputFilename, webhook_success, create_now, passthrough } =
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

		// PDFs require a pages array structure
		const request: PlacidCreatePdfRequest = {
			pages: [
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

		return await client.createPdf(request);
	},
});
