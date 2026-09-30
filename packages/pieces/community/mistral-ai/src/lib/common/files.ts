function formatFile(file: MistralFile) {
	return {
		id: file.id,
		filename: file.filename,
		purpose: file.purpose,
		bytes: file.bytes,
		mimetype: file.mimetype ?? null,
		source: file.source ?? null,
		sample_type: file.sample_type ?? null,
		num_lines: file.num_lines ?? null,
		created_at: toIso(file.created_at),
		expires_at: toIso(file.expires_at),
	};
}

function toIso(seconds: number | null | undefined): string | null {
	if (seconds === null || seconds === undefined) {
		return null;
	}
	return new Date(seconds * 1000).toISOString();
}

export const fileUtils = { formatFile, toIso };

export const FILE_PURPOSE_OPTIONS = [
	{ label: 'OCR', value: 'ocr' },
	{ label: 'Batch', value: 'batch' },
	{ label: 'Fine-tune', value: 'fine-tune' },
];

export type MistralFile = {
	id: string;
	filename: string;
	purpose: string;
	bytes: number;
	created_at: number;
	mimetype?: string | null;
	source?: string;
	sample_type?: string;
	num_lines?: number | null;
	expires_at?: number | null;
};
