import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { libraryUtils, MistralDocument } from '../common/libraries';
import { documentOutputSchema } from '../output-schemas';

export const updateLibraryDocument = createAction({
	auth: mistralAuth,
	name: 'update_library_document',
	classification: 'WRITE',
	displayName: 'Update Library Document',
	description: 'Rename a library document, set its attributes or an expiry date (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a library document’s name, custom attributes and/or automatic-deletion date (Beta); a field you leave empty keeps its current value, but passing attributes replaces the whole attribute set. It does not change the file content. Idempotent: sending the same values again leaves the same document.',
		idempotent: true,
	},
	outputSchema: documentOutputSchema,
	props: {
		library_id: libraryUtils.libraryIdProp(),
		document_id: libraryUtils.documentIdProp(),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		attributes: Property.Json({
			displayName: 'Attributes',
			description: 'Custom key-value attributes as a JSON object. Replaces the existing attributes.',
			required: false,
		}),
		expires_at: Property.DateTime({
			displayName: 'Delete After',
			description: 'The document is deleted automatically after this date.',
			required: false,
		}),
	},
	async run(context) {
		const { library_id, document_id, name, attributes, expires_at } = context.propsValue;
		const body = mistralApi.compact({
			name,
			attributes: mistralApi.parseJsonInput({ value: attributes, fieldName: 'Attributes' }),
			expires_at,
		});
		if (Object.keys(body).length === 0) {
			throw new Error('Provide at least one field to update.');
		}
		const document = await mistralApi.call<MistralDocument>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: libraryUtils.documentPath({ libraryId: library_id, documentId: document_id }),
			body,
		});
		return libraryUtils.formatDocument(document);
	},
});
