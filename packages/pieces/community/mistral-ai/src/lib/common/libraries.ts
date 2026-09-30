import { Property } from '@activepieces/pieces-framework';

function formatLibrary(library: MistralLibrary) {
	return {
		id: library.id,
		name: library.name,
		description: library.description ?? null,
		generated_description: library.generated_description ?? null,
		owner_type: library.owner_type ?? null,
		owner_id: library.owner_id ?? null,
		nb_documents: library.nb_documents ?? null,
		total_size: library.total_size ?? null,
		chunk_size: library.chunk_size ?? null,
		created_at: library.created_at,
		updated_at: library.updated_at,
	};
}

function formatDocument(document: MistralDocument) {
	return {
		id: document.id,
		library_id: document.library_id,
		name: document.name,
		mime_type: document.mime_type ?? null,
		extension: document.extension ?? null,
		size: document.size ?? null,
		number_of_pages: document.number_of_pages ?? null,
		summary: document.summary ?? null,
		process_status: document.process_status ?? null,
		attributes: document.attributes ?? null,
		expires_at: document.expires_at ?? null,
		created_at: document.created_at,
		last_processed_at: document.last_processed_at ?? null,
	};
}

function libraryIdProp() {
	return Property.ShortText({
		displayName: 'Library ID',
		description: 'The library UUID, from List Libraries or Create Library.',
		required: true,
	});
}

function documentIdProp() {
	return Property.ShortText({
		displayName: 'Document ID',
		description: 'The document UUID, from List Library Documents or Upload Library Document.',
		required: true,
	});
}

function documentPath({ libraryId, documentId }: { libraryId: string; documentId: string }): string {
	return `/libraries/${encodeURIComponent(libraryId)}/documents/${encodeURIComponent(documentId)}`;
}

export const libraryUtils = { formatLibrary, formatDocument, libraryIdProp, documentIdProp, documentPath };

export type MistralLibrary = {
	id: string;
	name: string;
	description?: string | null;
	generated_description?: string | null;
	owner_type?: string;
	owner_id?: string | null;
	nb_documents?: number;
	total_size?: number;
	chunk_size?: number | null;
	created_at: string;
	updated_at: string;
};

export type MistralDocument = {
	id: string;
	library_id: string;
	name: string;
	mime_type?: string | null;
	extension?: string | null;
	size?: number | null;
	number_of_pages?: number | null;
	summary?: string | null;
	process_status?: string;
	attributes?: Record<string, unknown> | null;
	expires_at?: string | null;
	created_at: string;
	last_processed_at?: string | null;
};
