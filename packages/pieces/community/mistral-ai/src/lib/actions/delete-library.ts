import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralLibrary } from '../common/libraries';
import { deleteLibraryOutputSchema } from '../output-schemas';

export const deleteLibrary = createAction({
	auth: mistralAuth,
	name: 'delete_library',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Library',
	description: 'Permanently delete a document library and all its documents (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a document library (Beta) and every document in it by UUID; agents that use it lose access. Use Delete Library Document to remove a single document instead. Not idempotent: a repeat call fails because the library is gone.',
		idempotent: false,
	},
	outputSchema: deleteLibraryOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
	},
	async run(context) {
		const library = await mistralApi.call<MistralLibrary>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/libraries/${encodeURIComponent(context.propsValue.library_id)}`,
		});
		return { ...libraryUtils.formatLibrary(library), deleted: true };
	},
});
