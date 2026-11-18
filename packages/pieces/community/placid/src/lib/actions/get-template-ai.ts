import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { templateUuidText } from '../common/props';

export const getTemplateAi = createAction({
	auth: placidAuth,
	name: 'get_template_ai',
	classification: 'READ',
	displayName: 'Get Template (AI)',
	description: 'Get a Placid template and its layer names.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one Placid template by UUID: title, size, tags and its layers (name and type). Use the layer names as keys in the layers object of Create Image/PDF/Video (AI). Text layers take {"text": ...}, picture layers {"image": "<url>"} (or {"video": "<url>"} in videos), shape layers {"background_color": "#hex"}, barcode/rating layers {"value": ...}; any layer accepts {"hide": true}. Read-only.',
		idempotent: true,
	},
	outputSchema: placidSchemas.template,
	props: { template_uuid: templateUuidText },
	async run({ auth, propsValue }) {
		const template = await new PlacidClient(auth).getTemplate(propsValue.template_uuid.trim());
		return {
			uuid: template.uuid,
			title: template.title,
			thumbnail: template.thumbnail ?? null,
			width: template.width ?? null,
			height: template.height ?? null,
			tags: template.tags ?? [],
			layers: (template.layers ?? []).map((layer) => ({ name: layer.name, type: layer.type })),
		};
	},
});
