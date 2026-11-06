import { Property } from '@activepieces/pieces-framework';

function documentId<R extends boolean>({ required, displayName = 'Document ID', description = 'Document ID (UUID). Returned by Convert Document, Run Extractor and List Documents.' }: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function extractorId<R extends boolean>({ required, displayName = 'Extractor ID', description = 'Extractor ID (UUID). Use List Extractors to find it.' }: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function file<R extends boolean>({ required, displayName = 'File', description = 'The document to process: a PDF, DOCX or image, as a file or a public URL.' }: PropParams<R>) {
	return Property.File({ displayName, description, required });
}

function booleanFlag<R extends boolean>({ required, displayName = 'Flag', description }: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			options: [
				{ label: 'True', value: 'true' },
				{ label: 'False', value: 'false' },
			],
		},
	});
}

export const doctlyAiProps = { documentId, extractorId, file, booleanFlag };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
