import { createAction } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import { PlacidClient, placidHelpers } from '../common/client';
import { placidSchemas } from '../common/output-schemas';
import { PlacidCollection } from '../common';

export const listCollectionsAi = createAction({
	auth: placidAuth,
	name: 'list_collections_ai',
	classification: 'SEARCH',
	displayName: 'List Collections (AI)',
	description: 'List template collections in the Placid project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the template collections in the Placid project with their ID, title and the UUIDs of the templates they contain. Use a collection ID as collection_id in List Templates (AI) to narrow templates. Read-only.',
		idempotent: true,
	},
	outputSchema: placidSchemas.collections,
	props: {},
	async run({ auth }) {
		const collections = await new PlacidClient(auth).listCollections();
		return { collections: collections.map(summarizeCollection) };
	},
});

function summarizeCollection(collection: PlacidCollection) {
	const source = collection.template_uuids ?? collection.templates ?? [];
	const templateUuids = source
		.map((entry) => {
			if (typeof entry === 'string') return entry;
			if (placidHelpers.isPlainObject(entry) && typeof entry['uuid'] === 'string') return entry['uuid'];
			return null;
		})
		.filter((uuid): uuid is string => uuid !== null);
	return { id: collection.id, title: collection.title ?? null, template_uuids: templateUuids };
}
