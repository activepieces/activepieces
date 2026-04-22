import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { documentIdProp } from '../common/props';

const EXPORT_FORMATS: Record<string, { mimeType: string; extension: string }> = {
	pdf: { mimeType: 'application/pdf', extension: 'pdf' },
	docx: {
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		extension: 'docx',
	},
	odt: { mimeType: 'application/vnd.oasis.opendocument.text', extension: 'odt' },
	rtf: { mimeType: 'application/rtf', extension: 'rtf' },
	txt: { mimeType: 'text/plain', extension: 'txt' },
	html: { mimeType: 'text/html', extension: 'html' },
	epub: { mimeType: 'application/epub+zip', extension: 'epub' },
};

export const exportDocument = createAction({
	auth: googleDocsAuth,
	name: 'export_document',
	displayName: 'Export Document',
	description: 'Download a Google Doc in PDF, DOCX, TXT, HTML, ODT, RTF, or EPUB format.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc to export.'),
		format: Property.StaticDropdown({
			displayName: 'Export Format',
			description: 'The format to export the document as.',
			required: true,
			defaultValue: 'pdf',
			options: {
				disabled: false,
				options: [
					{ label: 'PDF', value: 'pdf' },
					{ label: 'Microsoft Word (.docx)', value: 'docx' },
					{ label: 'OpenDocument (.odt)', value: 'odt' },
					{ label: 'Rich Text (.rtf)', value: 'rtf' },
					{ label: 'Plain Text (.txt)', value: 'txt' },
					{ label: 'HTML', value: 'html' },
					{ label: 'EPUB', value: 'epub' },
				],
			},
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Optional file name (without extension). Defaults to the document title.',
			required: false,
		}),
	},
	async run(context) {
		const { documentId, format, fileName } = context.propsValue;

		const formatSpec = EXPORT_FORMATS[format];
		if (!formatSpec) {
			throw new Error(`Unsupported export format: ${format}`);
		}

		const authClient = await createGoogleClient(context.auth);
		const drive = google.drive({ version: 'v3', auth: authClient });

		const [metadata, exported] = await Promise.all([
			drive.files.get({
				fileId: documentId,
				supportsAllDrives: true,
				fields: 'id, name',
			}),
			drive.files.export(
				{ fileId: documentId, mimeType: formatSpec.mimeType },
				{ responseType: 'arraybuffer' },
			),
		]);

		const buffer = Buffer.from(exported.data as ArrayBuffer);
		const safeTitle = (fileName?.trim() || metadata.data.name || 'document').replace(
			/[\\/:*?"<>|]/g,
			'_',
		);
		const outputFileName = `${safeTitle}.${formatSpec.extension}`;

		const fileUrl = await context.files.write({
			fileName: outputFileName,
			data: buffer,
		});

		return {
			documentId,
			fileName: outputFileName,
			mimeType: formatSpec.mimeType,
			size: buffer.length,
			file: fileUrl,
		};
	},
});
