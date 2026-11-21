import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { aiFilenameText, aiPassthroughText, waitForResultDropdown } from '../common/props';
import { PlacidCreatePdfRequest, PlacidPdfModifications } from '../common';

export const createPdfAi = createAction({
	auth: placidAuth,
	name: 'create_pdf_ai',
	classification: 'WRITE',
	displayName: 'Create PDF (AI)',
	description: 'Render a PDF from one or more Placid templates (one per page).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renders a PDF in Placid (uses Placid credits per page). pages is a list, one entry per page: [{"template_uuid": "...", "layers": {"title": {"text": "Hello"}}}]. Get template UUIDs from List Templates (AI) and layer names from Get Template (AI); unknown layer names are rejected with the valid list. With wait_for_result "yes" (default) it waits up to 5 minutes and returns status "finished" with pdf_url; if still "queued" after that it returns the ID: call Get PDF with it instead of creating again. Every call creates a new PDF.',
		idempotent: false,
	},
	outputSchema: placidSchemas.pdf,
	props: {
		pages: Property.Array({
			displayName: 'Pages',
			description: 'One entry per page, each with a template UUID and an optional layers object {"<layer name>": {"text": "..."}}.',
			required: true,
			properties: {
				template_uuid: Property.ShortText({ displayName: 'Template UUID', required: true }),
				layers: Property.Json({ displayName: 'Layers', required: false }),
			},
		}),
		filename: aiFilenameText,
		image_quality: Property.StaticDropdown<string>({
			displayName: 'Image Quality',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'High', value: 'high' },
					{ label: 'Medium', value: 'medium' },
					{ label: 'Low', value: 'low' },
				],
			},
		}),
		dpi: Property.StaticDropdown<string>({
			displayName: 'DPI',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '96', value: '96' },
					{ label: '150', value: '150' },
					{ label: '300', value: '300' },
				],
			},
		}),
		color_mode: Property.StaticDropdown<string>({
			displayName: 'Color Mode',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'RGB', value: 'rgb' },
					{ label: 'CMYK', value: 'cmyk' },
				],
			},
		}),
		passthrough: aiPassthroughText,
		wait_for_result: waitForResultDropdown,
	},
	async run({ auth, propsValue }) {
		const pages = placidHelpers.parseTemplateParts({ value: propsValue.pages, field: 'pages' });
		const client = new PlacidClient(auth);
		await placidHelpers.assertLayersExist({ client, parts: pages });
		const modifications: PlacidPdfModifications = {
			...(propsValue.filename ? { filename: propsValue.filename } : {}),
			...(propsValue.image_quality ? { image_quality: propsValue.image_quality } : {}),
			...(propsValue.dpi ? { dpi: Number(propsValue.dpi) } : {}),
			...(propsValue.color_mode ? { color_mode: propsValue.color_mode } : {}),
		};
		const request: PlacidCreatePdfRequest = {
			pages,
			...(Object.keys(modifications).length > 0 ? { modifications } : {}),
			...(propsValue.passthrough ? { passthrough: propsValue.passthrough } : {}),
			create_now: placidHelpers.toCreateNow(propsValue.wait_for_result),
		};
		return client.createPdf(request);
	},
});
