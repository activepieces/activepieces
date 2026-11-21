import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { placidAuth } from '../auth';
import { PlacidClient } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { PlacidTemplate } from '../common';

export const listTemplatesAi = createAction({
	auth: placidAuth,
	name: 'list_templates_ai',
	classification: 'SEARCH',
	displayName: 'List Templates (AI)',
	description: 'List templates in the Placid project with their layers.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists templates in the Placid project the API token belongs to, with each template UUID, title, tags, thumbnail and layers (name and type). Use it to find the template_uuid and layer names before creating an image, PDF or video. Optional filters: title_filter (partial title match), tag, collection_id, order_by. Returns up to limit templates (default 20, max 100) and has_more=true if more match. Read-only.',
		idempotent: true,
	},
	outputSchema: placidSchemas.templates,
	props: {
		title_filter: Property.ShortText({
			displayName: 'Title Filter',
			description: 'Only templates whose title contains this text.',
			required: false,
		}),
		tag: Property.ShortText({
			displayName: 'Tag',
			description: 'Only templates with this tag.',
			required: false,
		}),
		collection_id: Property.ShortText({
			displayName: 'Collection ID',
			description: 'Only templates in this collection. Get IDs from List Collections (AI).',
			required: false,
		}),
		order_by: Property.StaticDropdown<string>({
			displayName: 'Order By',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Created (newest first)', value: 'created_at-desc' },
					{ label: 'Created (oldest first)', value: 'created_at-asc' },
					{ label: 'Updated (newest first)', value: 'updated_at-desc' },
					{ label: 'Updated (oldest first)', value: 'updated_at-asc' },
					{ label: 'Title (A-Z)', value: 'title-asc' },
					{ label: 'Title (Z-A)', value: 'title-desc' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum templates to return (1-100, default 20).',
			required: false,
			defaultValue: 20,
		}),
	},
	async run({ auth, propsValue }) {
		const requested = Number(propsValue.limit ?? 20);
		const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.floor(requested), 1), 100) : 20;
		const queryParams: QueryParams = {};
		const filters: [string, string | undefined][] = [
			['title_filter', propsValue.title_filter],
			['tag', propsValue.tag],
			['collection_id', propsValue.collection_id],
			['order_by', propsValue.order_by],
		];
		for (const [key, value] of filters) {
			const trimmed = value?.trim();
			if (trimmed) {
				queryParams[key] = trimmed;
			}
		}
		const client = new PlacidClient(auth);
		const templates: PlacidTemplate[] = [];
		let page = await client.listTemplatePage({ queryParams });
		templates.push(...page.data);
		while (page.next && templates.length < limit) {
			page = await client.listTemplatePage({ url: page.next });
			templates.push(...page.data);
		}
		return {
			templates: templates.slice(0, limit).map(summarizeTemplate),
			has_more: templates.length > limit || Boolean(page.next),
		};
	},
});

function summarizeTemplate(template: PlacidTemplate) {
	return {
		uuid: template.uuid,
		title: template.title,
		thumbnail: template.thumbnail ?? null,
		width: template.width ?? null,
		height: template.height ?? null,
		tags: template.tags ?? [],
		layers: (template.layers ?? []).map((layer) => ({ name: layer.name, type: layer.type })),
	};
}
