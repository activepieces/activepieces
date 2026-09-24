import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralLibrary } from '../common/libraries';
import { libraryOutputSchema } from '../output-schemas';

export const updateLibrary = createAction({
	auth: mistralAuth,
	name: 'update_library',
	classification: 'WRITE',
	displayName: 'Update Library',
	description: 'Rename a document library or change its description (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a document library’s name and/or description (Beta) by UUID; a field you leave empty keeps its current value. Idempotent: sending the same values again leaves the same library.',
		idempotent: true,
	},
	outputSchema: libraryOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
	},
	async run(context) {
		const { library_id, name, description } = context.propsValue;
		const body = mistralApi.compact({ name, description });
		if (Object.keys(body).length === 0) {
			throw new Error('Provide a name or a description to update.');
		}
		const library = await mistralApi.call<MistralLibrary>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/libraries/${encodeURIComponent(library_id)}`,
			body,
		});
		return libraryUtils.formatLibrary(library);
	},
});
