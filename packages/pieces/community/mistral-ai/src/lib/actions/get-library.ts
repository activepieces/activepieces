import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralLibrary } from '../common/libraries';
import { libraryOutputSchema } from '../output-schemas';

export const getLibrary = createAction({
	auth: mistralAuth,
	name: 'get_library',
	classification: 'READ',
	displayName: 'Get Library',
	description: 'Get the details of a document library (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one document library’s details (Beta) by UUID: name, description, owner, document count, total size and chunk size. Use List Library Documents to see its documents. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: libraryOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
	},
	async run(context) {
		const library = await mistralApi.call<MistralLibrary>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/libraries/${encodeURIComponent(context.propsValue.library_id)}`,
		});
		return libraryUtils.formatLibrary(library);
	},
});
