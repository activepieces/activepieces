import { createAction, Property } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { aiFilenameText, aiLayersJson, aiPassthroughText, templateUuidText, waitForResultDropdown } from '../common/props';
import { PlacidCreateImageRequest, PlacidImageModifications } from '../common';

export const createImageAi = createAction({
	auth: placidAuth,
	name: 'create_image_ai',
	classification: 'WRITE',
	displayName: 'Create Image (AI)',
	description: 'Render an image from a Placid template with layer values given as JSON.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renders an image from a Placid template (uses 1 Placid credit). Pass template_uuid from List Templates (AI) and layers as a JSON object keyed by layer name from Get Template (AI), e.g. {"title": {"text": "Hello"}, "photo": {"image": "https://..."}}; unknown layer names are rejected with the list of valid ones. With wait_for_result "yes" (default) it waits up to 5 minutes and returns status "finished" with image_url; if still "queued" after that it returns the ID: call Get Image with it instead of creating again. A render that fails returns an error with Placid\'s error_message. Every call creates a new image.',
		idempotent: false,
	},
	outputSchema: placidSchemas.image,
	props: {
		template_uuid: templateUuidText,
		layers: aiLayersJson,
		width: Property.Number({ displayName: 'Width', description: 'Optional output width in pixels.', required: false }),
		height: Property.Number({ displayName: 'Height', description: 'Optional output height in pixels.', required: false }),
		filename: aiFilenameText,
		image_format: Property.StaticDropdown<string>({
			displayName: 'Image Format',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'PNG', value: 'png' },
					{ label: 'JPG', value: 'jpg' },
				],
			},
		}),
		dpi: Property.StaticDropdown<string>({
			displayName: 'DPI',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: '72', value: '72' },
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
		const templateUuid = propsValue.template_uuid.trim();
		const layers = placidHelpers.parseLayers({ value: propsValue.layers, field: 'layers' });
		const client = new PlacidClient(auth);
		await placidHelpers.assertLayersExist({ client, parts: [{ template_uuid: templateUuid, ...(layers ? { layers } : {}) }] });
		const modifications: PlacidImageModifications = {
			...(propsValue.width ? { width: propsValue.width } : {}),
			...(propsValue.height ? { height: propsValue.height } : {}),
			...(propsValue.filename ? { filename: propsValue.filename } : {}),
			...(propsValue.image_format ? { image_format: propsValue.image_format } : {}),
			...(propsValue.dpi ? { dpi: Number(propsValue.dpi) } : {}),
			...(propsValue.color_mode ? { color_mode: propsValue.color_mode } : {}),
		};
		const request: PlacidCreateImageRequest = {
			template_uuid: templateUuid,
			...(layers ? { layers } : {}),
			...(Object.keys(modifications).length > 0 ? { modifications } : {}),
			...(propsValue.passthrough ? { passthrough: propsValue.passthrough } : {}),
			create_now: placidHelpers.toCreateNow(propsValue.wait_for_result),
		};
		return client.createImage(request);
	},
});
